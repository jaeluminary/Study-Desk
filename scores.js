/**
 * STUDY DESK - SCORE TRACKER & MONTHLY POSTCARDS
 * Grade analytics, SVG trend charts, and generative monthly progress postcards with archive.
 */

import { store } from '../core/store.js';
import { deskAudio } from '../core/audio.js';
import { notifier } from '../components/notification.js';
import { createPushpinSVG, createWashiTape, createPostmarkHTML, renderIcon } from '../components/decorations.js';

export function calculateScoreStats(scores) {
  if (!scores || scores.length === 0) {
    return { overallAvg: 0, bestSubject: 'N/A', lowestSubject: 'N/A', subjectAverages: {}, bestScore: 0, lowestScore: 0 };
  }

  let totalPct = 0;
  const subjectMap = {};
  let bestScore = 0;
  let lowestScore = 100;

  scores.forEach(sc => {
    const pct = (sc.score / sc.maxScore) * 100;
    totalPct += pct;
    bestScore = Math.max(bestScore, pct);
    lowestScore = Math.min(lowestScore, pct);

    if (!subjectMap[sc.subject]) {
      subjectMap[sc.subject] = { sum: 0, count: 0 };
    }
    subjectMap[sc.subject].sum += pct;
    subjectMap[sc.subject].count += 1;
  });

  const overallAvg = Number((totalPct / scores.length).toFixed(1));

  let bestSubject = 'N/A';
  let bestSubAvg = -1;
  let lowestSubject = 'N/A';
  let lowestSubAvg = 101;

  const subjectAverages = {};
  for (const [subj, data] of Object.entries(subjectMap)) {
    const avg = Number((data.sum / data.count).toFixed(1));
    subjectAverages[subj] = avg;
    if (avg > bestSubAvg) {
      bestSubAvg = avg;
      bestSubject = subj;
    }
    if (avg < lowestSubAvg) {
      lowestSubAvg = avg;
      lowestSubject = subj;
    }
  }

  return {
    overallAvg,
    bestSubject,
    lowestSubject,
    subjectAverages,
    bestScore: Number(bestScore.toFixed(1)),
    lowestScore: Number(lowestScore.toFixed(1))
  };
}

export function renderScoresPreview() {
  const state = store.getState();
  const scores = state.scores || [];
  const stats = calculateScoreStats(scores);

  return `
    <div class="paper-card score-card paper-yellow" id="scores-paper">
      ${createPushpinSVG('var(--pin-color-1)', 'pin-right')}
      
      <div class="paper-header">
        <h3 class="paper-title" data-open-route="scores">
          ${renderIcon('award', 18)} Score Tracker
        </h3>
        <button class="desk-btn desk-btn-sm" data-open-route="scores" title="Open Gradebook & Postcards">
          ${renderIcon('maximize-2', 14)}
        </button>
      </div>

      <div class="score-stats-row">
        <div class="score-average-circle">
          <span class="score-avg-num">${stats.overallAvg}%</span>
          <span class="score-avg-lbl">Average</span>
        </div>

        <div style="flex: 1; margin-left: 14px; font-size: 0.85rem;">
          <div style="margin-bottom: 4px;">
            <span style="color: var(--ink-muted);">Top Subject:</span> <strong>${escapeHTML(stats.bestSubject)}</strong>
          </div>
          <div>
            <span style="color: var(--ink-muted);">Assessments:</span> <strong>${scores.length} logged</strong>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
        <span style="font-size: 0.72rem; color: var(--ink-muted);">
          💌 Monthly Postcard Ready
        </span>
        <button class="desk-btn desk-btn-sm desk-btn-primary" data-open-route="scores">
          ${renderIcon('plus', 12)} Log Score
        </button>
      </div>
    </div>
  `;
}

export function renderScoresDetail() {
  const state = store.getState();
  const scores = state.scores || [];
  const stats = calculateScoreStats(scores);
  const knownSubjects = state.folders.map(f => f.name);

  // SVG Trend Points
  const trendPoints = scores.map((sc, i) => {
    const x = 30 + (i / Math.max(1, scores.length - 1)) * 340;
    const pct = (sc.score / sc.maxScore) * 100;
    const y = 140 - (pct / 100) * 110;
    return { x, y, pct, name: sc.name };
  });

  const polylineStr = trendPoints.map(p => `${p.x},${p.y}`).join(' ');

  return {
    title: `${renderIcon('award', 22)} Score Tracker & Monthly Postcards`,
    body: `
      <div>
        <div class="desk-tabs">
          <button type="button" class="desk-tab-btn active" data-tab="tab-scores-log">Gradebook Log</button>
          <button type="button" class="desk-tab-btn" data-tab="tab-monthly-postcard">Monthly Postcard</button>
          <button type="button" class="desk-tab-btn" data-tab="tab-postcard-archive">Postcard Collection</button>
        </div>

        <!-- TAB 1: Log & Graph -->
        <div id="tab-scores-log" class="tab-pane">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h4 style="font-family: var(--font-hand); font-size: 1.4rem; margin: 0;">Score Trend & Overview</h4>
            <button type="button" class="desk-btn desk-btn-sm desk-btn-primary" id="btn-toggle-add-score">
              ${renderIcon('plus', 14)} Add Score
            </button>
          </div>

          <!-- Add Score Form -->
          <form id="new-score-form" style="display: none; background: rgba(0,0,0,0.03); padding: 16px; border-radius: var(--radius-md); margin-bottom: 18px; border: 1.5px dashed var(--ink-border-strong);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px;">
              <div>
                <label class="desk-label" for="sc-subject">Subject *</label>
                <select id="sc-subject" class="desk-select" required>
                  ${knownSubjects.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="desk-label" for="sc-name">Assessment Name *</label>
                <input type="text" id="sc-name" class="desk-input" required placeholder="e.g. Midterm 1, Quiz 3">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 120px 100px 100px 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="desk-label" for="sc-type">Type</label>
                <select id="sc-type" class="desk-select">
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label class="desk-label" for="sc-points">Score *</label>
                <input type="number" step="0.5" id="sc-points" class="desk-input" required value="90">
              </div>
              <div>
                <label class="desk-label" for="sc-max">Max Score</label>
                <input type="number" step="0.5" id="sc-max" class="desk-input" required value="100">
              </div>
              <div>
                <label class="desk-label" for="sc-date">Date</label>
                <input type="date" id="sc-date" class="desk-input" value="${new Date().toISOString().slice(0, 10)}">
              </div>
            </div>

            <button type="submit" class="desk-btn desk-btn-primary desk-btn-sm">Save Assessment</button>
          </form>

          <!-- SVG Trend Chart -->
          <div style="background: #FFFFFF; border: 1px solid var(--ink-border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--ink-muted); text-transform: uppercase; margin-bottom: 8px;">Score Trajectory (%)</div>
            <svg viewBox="0 0 400 160" width="100%" height="160">
              <line x1="30" y1="30" x2="380" y2="30" stroke="rgba(0,0,0,0.06)" stroke-dasharray="2 2"/>
              <text x="15" y="34" font-size="10" fill="var(--ink-muted)">100</text>
              <line x1="30" y1="85" x2="380" y2="85" stroke="rgba(0,0,0,0.06)" stroke-dasharray="2 2"/>
              <text x="15" y="89" font-size="10" fill="var(--ink-muted)">50</text>
              <line x1="30" y1="140" x2="380" y2="140" stroke="rgba(0,0,0,0.15)"/>
              <text x="15" y="144" font-size="10" fill="var(--ink-muted)">0</text>
              
              <polyline points="${polylineStr}" fill="none" stroke="var(--primary-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              
              ${trendPoints.map(p => `
                <circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--primary-color)" stroke="#FFFFFF" stroke-width="2"/>
                <text x="${p.x}" y="${p.y - 8}" font-size="10" font-weight="bold" fill="var(--ink-primary)" text-anchor="middle">${p.pct}%</text>
              `).join('')}
            </svg>
          </div>

          <!-- Log Table -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${scores.map(sc => {
              const pct = ((sc.score / sc.maxScore) * 100).toFixed(1);
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #FFFFFF; border: 1px solid var(--ink-border); border-radius: var(--radius-sm);">
                  <div>
                    <strong>${escapeHTML(sc.name)}</strong>
                    <span class="desk-tag" style="margin-left: 6px;">${escapeHTML(sc.subject)}</span>
                    <span style="font-size: 0.75rem; color: var(--ink-muted); margin-left: 6px;">${sc.date}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-family: var(--font-hand); font-size: 1.3rem; font-weight: bold; color: var(--primary-color);">${sc.score}/${sc.maxScore} (${pct}%)</span>
                    <button type="button" class="desk-btn desk-btn-sm desk-btn-danger" data-delete-score="${sc.id}">
                      ${renderIcon('trash-2', 12)}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- TAB 2: Live Monthly Postcard -->
        <div id="tab-monthly-postcard" class="tab-pane" style="display: none;">
          <div class="monthly-postcard-render paper-card paper-postcard" style="border: 3px double #D8CCA8; padding: 28px; max-width: 620px; margin: 0 auto; box-shadow: var(--shadow-modal); position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed var(--ink-border); padding-bottom: 16px; margin-bottom: 18px;">
              <div>
                <span style="font-family: var(--font-hand); font-size: 1.2rem; color: var(--ink-muted); text-transform: uppercase;">Official Monthly Progress Report</span>
                <h3 style="font-family: var(--font-hand); font-size: 2.2rem; margin: 0; color: var(--ink-primary);">
                  September 2026 Postcard
                </h3>
              </div>
              <div>
                ${createPostmarkHTML('STUDY POSTAL ACADEMY', 'SEP 2026')}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
              <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: var(--radius-sm);">
                <div style="font-size: 0.78rem; color: var(--ink-muted); text-transform: uppercase; font-weight: 700;">Overall Average</div>
                <div style="font-family: var(--font-hand); font-size: 2.4rem; font-weight: bold; color: var(--primary-color);">
                  ${stats.overallAvg}% <span style="font-size: 1.1rem; color: #2E7D32;">▲ +2.4%</span>
                </div>
              </div>

              <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: var(--radius-sm);">
                <div style="font-size: 0.78rem; color: var(--ink-muted); text-transform: uppercase; font-weight: 700;">Top Subject</div>
                <div style="font-family: var(--font-hand); font-size: 1.6rem; font-weight: bold; color: var(--secondary-color);">
                  ${escapeHTML(stats.bestSubject)}
                </div>
              </div>
            </div>

            <div style="font-style: italic; font-size: 1.05rem; color: var(--ink-secondary); border-left: 3px solid var(--accent-3); padding-left: 14px; margin-bottom: 20px;">
              "You showed up consistently this month. Every mechanism practiced and lecture reviewed brought clarity. Keep following the curiosity."
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--ink-muted); border-top: 1px solid var(--ink-border); padding-top: 10px;">
              <span>Scores Logged: ${scores.length}</span>
              <span>Study Hours: 32.4 hrs</span>
              <span>Study Desk Stamp of Excellence</span>
            </div>
          </div>

          <div style="display: flex; justify-content: center; gap: 12px; margin-top: 16px;">
            <button type="button" class="desk-btn desk-btn-primary" onclick="window.print()">
              ${renderIcon('download', 14)} Print / Save Postcard
            </button>
          </div>
        </div>

        <!-- TAB 3: Postcard Archive Collection -->
        <div id="tab-postcard-archive" class="tab-pane" style="display: none;">
          <h4 style="font-family: var(--font-hand); font-size: 1.5rem; margin-bottom: 12px;">Past Monthly Postcards Archive</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            ${state.monthlyPostcards.map(pc => `
              <div class="paper-card paper-postcard" style="padding: 16px; border: 1.5px dashed var(--ink-border-strong);">
                <div style="display: flex; justify-content: space-between;">
                  <h5 style="font-family: var(--font-hand); font-size: 1.4rem; margin: 0;">${escapeHTML(pc.monthYear)}</h5>
                  <span class="desk-tag">${pc.overallAverage}% Avg</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--ink-secondary); font-style: italic; margin: 8px 0;">"${escapeHTML(pc.quote)}"</p>
                <div style="font-size: 0.75rem; color: var(--ink-muted);">
                  Top: ${escapeHTML(pc.bestSubject)} • ${pc.studyHours} hrs logged
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="desk-btn desk-btn-primary" data-close-modal>
        ${renderIcon('check', 16)} Done
      </button>
    `,
    onMount: (bodyEl) => {
      // Tab switcher
      bodyEl.querySelectorAll('.desk-tab-btn').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
          bodyEl.querySelectorAll('.desk-tab-btn').forEach(b => b.classList.remove('active'));
          bodyEl.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
          tabBtn.classList.add('active');
          const targetId = tabBtn.dataset.tab;
          bodyEl.querySelector(`#${targetId}`).style.display = 'block';
        });
      });

      // Add score toggle
      const toggleBtn = bodyEl.querySelector('#btn-toggle-add-score');
      const addForm = bodyEl.querySelector('#new-score-form');
      toggleBtn?.addEventListener('click', () => {
        addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
      });

      // Form submit
      addForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = bodyEl.querySelector('#sc-subject').value;
        const name = bodyEl.querySelector('#sc-name').value.trim();
        const type = bodyEl.querySelector('#sc-type').value;
        const score = parseFloat(bodyEl.querySelector('#sc-points').value) || 0;
        const maxScore = parseFloat(bodyEl.querySelector('#sc-max').value) || 100;
        const date = bodyEl.querySelector('#sc-date').value;

        if (!name) return;

        const newScore = {
          id: `sc-${Date.now()}`,
          subject,
          name,
          type,
          score,
          maxScore,
          date
        };

        deskAudio.playClick();
        store.setState(s => ({
          ...s,
          scores: [newScore, ...s.scores]
        }), 'score_created');

        notifier.show({
          title: 'Score Recorded!',
          body: `Added ${name} (${((score/maxScore)*100).toFixed(0)}%)`,
          icon: '📊'
        });

        window.location.hash = '';
        setTimeout(() => window.location.hash = '#scores', 50);
      });

      // Delete score
      bodyEl.querySelectorAll('[data-delete-score]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.deleteScore;
          if (confirm('Delete this assessment record?')) {
            deskAudio.playClick();
            store.setState(s => ({
              ...s,
              scores: s.scores.filter(sc => sc.id !== id)
            }), 'score_deleted');
            window.location.hash = '';
            setTimeout(() => window.location.hash = '#scores', 50);
          }
        });
      });
    }
  };
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
