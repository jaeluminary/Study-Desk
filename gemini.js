/**
 * STUDY DESK - GEMINI AI MATERIAL SORTER SERVICE
 * Categorizes notes, documents, and links into subjects.
 * Uses secure server-side endpoint proxy or heuristic backup when offline.
 */

import { store } from './store.js';

export async function suggestSubjectForMaterial(material) {
  const state = store.getState();
  const knownSubjects = state.folders.map(f => f.name);

  // Payload for classification
  const payload = {
    title: material.title || '',
    tags: material.tags || [],
    type: material.type || 'note',
    contentPreview: (material.content || '').slice(0, 500),
    knownSubjects
  };

  // If a secure backend proxy endpoint is configured in Settings, invoke it
  const endpoint = state.geminiProxyEndpoint || '/api/ai-sort';
  
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.suggestedSubject) {
        return {
          subject: data.suggestedSubject,
          confidence: data.confidence || 0.9,
          isNewSubject: !knownSubjects.includes(data.suggestedSubject)
        };
      }
    }
  } catch (err) {
    // Network or proxy not reachable, proceed to heuristic classifier
  }

  // Robust client-side classifier fallback based on keywords & tags
  return classifyMaterialLocally(payload, knownSubjects);
}

function classifyMaterialLocally(item, knownSubjects) {
  const text = `${item.title} ${item.tags.join(' ')} ${item.contentPreview}`.toLowerCase();

  const rules = [
    { subject: 'Organic Chemistry', keywords: ['chem', 'reaction', 'sn1', 'sn2', 'acid', 'base', 'synthesis', 'molecule', 'stereochemistry', 'solvent', 'carbocation', 'lab'] },
    { subject: 'Linear Algebra', keywords: ['math', 'matrix', 'vector', 'eigen', 'determinant', 'space', 'linear', 'diagonalization', 'transformation', 'basis'] },
    { subject: 'Modern European History', keywords: ['history', 'war', 'revolution', 'treaty', 'empire', 'century', 'europe', 'republic', 'industrial', 'political'] },
    { subject: 'Spanish Literature', keywords: ['spanish', 'vocab', 'grammar', 'novel', 'author', 'poem', 'literature', 'verb', 'translation', 'español'] }
  ];

  let bestSubject = knownSubjects[0] || 'General Studies';
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;
    rule.keywords.forEach(kw => {
      if (text.includes(kw)) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      bestSubject = rule.subject;
    }
  }

  // If no good match was found and text has a strong candidate word
  return {
    subject: bestSubject,
    confidence: bestScore > 0 ? 0.85 : 0.6,
    isNewSubject: !knownSubjects.includes(bestSubject)
  };
}
