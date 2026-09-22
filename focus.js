/**
 * STUDY DESK - FOCUS POSTCARD MODULE (Centerpiece)
 * Sets current subject, session intention, topic/material link, stamp, and history.
 */

import { store } from '../core/store.js';
import { createPushpinSVG, createWashiTape, createPostmarkHTML, renderIcon } from '../components/decorations.js';
import { notifier } from '../components/notification.js';

export function renderFocusPreview() {
  const state = store.getState();
  const focus = state.focus;

  return `
    <div class="paper-card focus-card" id="focus-postcard" data-open-route="focus">
      ${createWashiTape('var(--tape-color-2)', '-3deg', 'tape-left')}
      ${createPushpinSVG('var(--pin-color-1)', 'pin-right')}
      
      <div class="postcard-top-bar">
        <div>
          <span style="font-family: var(--font-hand); font-size: 1.1rem; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.08em;">
            Session Intention & Focus
          </span>
          <h2 class="paper-title" style="font-size: 2.1rem; margin-top: 2px;">
            Focus Postcard
          </h2>
        </div>
        <div class="postcard-stamp-area">
          ${createPostmarkHTML('DESK STUDY HQ')}
        </div>
      </div>

      <div class="focus-main-content">
        <div>
          <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 4px;">
            Currently Studying:
          </div>
          <div class="focus-subject-tag">
            ${escapeHTML(focus.currentSubject)}
          </div>
          ${focus.currentTopic ? `
            <span style="font-size: 0.96rem; font-weight: 600; color: var(--ink-secondary); margin-left: 8px;">
              / ${escapeHTML(focus.currentTopic)}
            </span>
          ` : ''}
        </div>

        <div class="focus-intention-quote">
          "${escapeHTML(focus.intention || 'Quiet focus, deep understanding, one concept at a time.')}"
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
          <div style="font-size: 0.78rem; color: var(--ink-muted);">
            Linked Material: <strong>${escapeHTML(getMaterialName(focus.materialId, state.materials))}</strong>
          </div>
          <span class="desk-btn desk-btn-sm" style="font-size: 0.75rem;">
            ${renderIcon('sparkles', 14)} Update Focus
          </span>
        </div>
      </div>
    </div>
  `;
}

export function renderFocusDetail() {
  const state = store.getState();
  const focus = state.focus;
  const knownSubjects = state.folders.map(f => f.name);

  return {
    title: `${renderIcon('sparkles', 22)} Focus Postcard Settings`,
    body: `
      <form id="focus-edit-form">
        <div class="desk-field-group">
          <label class="desk-label" for="focus-subject-input">Subject * (Required)</label>
          <input type="text" id="focus-subject-input" class="desk-input" required value="${escapeHTML(focus.currentSubject)}" list="subject-suggestions" placeholder="e.g. Organic Chemistry, Calculus III">
          <datalist id="subject-suggestions">
            ${knownSubjects.map(s => `<option value="${escapeHTML(s)}">`).join('')}
          </datalist>
        </div>

        <div class="desk-field-group">
          <label class="desk-label" for="focus-topic-input">Topic / Chapter (Optional)</label>
          <input type="text" id="focus-topic-input" class="desk-input" value="${escapeHTML(focus.currentTopic || '')}" placeholder="e.g. Chapter 8 Reaction Mechanisms">
        </div>

        <div class="desk-field-group">
          <label class="desk-label" for="focus-intention-input">One-Line Intention for this Session</label>
          <textarea id="focus-intention-input" class="desk-textarea" rows="2" placeholder="e.g. Understand the difference between SN1 and SN2 reaction pathways without distractions.">${escapeHTML(focus.intention || '')}</textarea>
        </div>

        <div class="desk-field-group">
          <label class="desk-label" for="focus-material-select">Link to Study Material (Optional)</label>
          <select id="focus-material-select" class="desk-select">
            <option value="">-- No material linked --</option>
            ${state.materials.map(m => `
              <option value="${m.id}" ${m.id === focus.materialId ? 'selected' : ''}>
                [${m.type.toUpperCase()}] ${escapeHTML(m.title)} (${escapeHTML(m.subject)})
              </option>
            `).join('')}
          </select>
        </div>

        <div style="margin-top: 24px;">
          <h4 style="font-family: var(--font-hand); font-size: 1.4rem; margin-bottom: 8px;">Recent Focus History</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${focus.history.map((hist, idx) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(0,0,0,0.03); border-radius: var(--radius-sm);">
                <div>
                  <strong>${escapeHTML(hist.subject)}</strong>
                  ${hist.topic ? `<span style="font-size: 0.85rem; color: var(--ink-secondary);"> — ${escapeHTML(hist.topic)}</span>` : ''}
                </div>
                <button type="button" class="desk-btn desk-btn-sm" data-restore-focus="${idx}">
                  Restore
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </form>
    `,
    footer: `
      <button type="button" class="desk-btn" data-close-modal>Cancel</button>
      <button type="submit" form="focus-edit-form" class="desk-btn desk-btn-primary">
        ${renderIcon('check', 16)} Save & Set Focus
      </button>
    `,
    onMount: (bodyEl) => {
      const form = bodyEl.querySelector('#focus-edit-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = bodyEl.querySelector('#focus-subject-input').value.trim();
        const topic = bodyEl.querySelector('#focus-topic-input').value.trim();
        const intention = bodyEl.querySelector('#focus-intention-input').value.trim();
        const materialId = bodyEl.querySelector('#focus-material-select').value;

        if (!subject) return;

        store.setState(s => {
          const newHistory = [
            { subject: s.focus.currentSubject, topic: s.focus.currentTopic, timestamp: Date.now() },
            ...s.focus.history.filter(h => h.subject !== subject || h.topic !== topic)
          ].slice(0, 10);

          return {
            ...s,
            focus: {
              currentSubject: subject,
              currentTopic: topic,
              intention,
              materialId,
              lastUpdated: Date.now(),
              history: newHistory
            }
          };
        }, 'focus_update');

        notifier.show({
          title: 'Focus Updated',
          body: `Now focusing on ${subject}`,
          icon: '✨'
        });

        window.location.hash = '';
      });

      // Restore past focus buttons
      bodyEl.querySelectorAll('[data-restore-focus]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.restoreFocus, 10);
          const item = store.getState().focus.history[idx];
          if (item) {
            bodyEl.querySelector('#focus-subject-input').value = item.subject;
            bodyEl.querySelector('#focus-topic-input').value = item.topic || '';
          }
        });
      });
    }
  };
}

function getMaterialName(matId, materials) {
  if (!matId) return 'None';
  const found = materials.find(m => m.id === matId);
  return found ? found.title : 'None';
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
