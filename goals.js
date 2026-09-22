/**
 * STUDY DESK - GOALS MODULE
 * Target tracking, 12h rate-limited check-ins, undo window, streaks, celebration, and shelf.
 */

import { store } from '../core/store.js';
import { deskAudio } from '../core/audio.js';
import { notifier } from '../components/notification.js';
import { createPushpinSVG, createRubberStamp, renderIcon } from '../components/decorations.js';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const UNDO_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function checkGoalEligibility(goal) {
  if (!goal.lastCheckIn) {
    return { canCheckIn: true, hoursRemaining: 0, canUndo: false };
  }

  const now = Date.now();
  const diff = now - goal.lastCheckIn;

  const canUndo = diff <= UNDO_WINDOW_MS;
  const canCheckIn = diff >= TWELVE_HOURS_MS;
  const msRemaining = Math.max(0, TWELVE_HOURS_MS - diff);
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minsRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return { canCheckIn, hoursRemaining, minsRemaining, canUndo };
}

export function performGoalCheckIn(goalId) {
  const state = store.getState();
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return;

  const eligibility = checkGoalEligibility(goal);
  if (!eligibility.canCheckIn) {
    notifier.show({
      title: 'Goal Already Checked In',
      body: `Please come back in ${eligibility.hoursRemaining}h ${eligibility.minsRemaining}m.`,
      icon: '⏳'
    });
    return;
  }

  deskAudio.playClick();

  const nextCount = goal.currentCount + 1;
  const isCompleted = nextCount >= goal.targetCount;
  let nextCycles = goal.cyclesCompleted || 0;
  let finalCount = nextCount;

  if (isCompleted) {
    nextCycles += 1;
    deskAudio.playCelebration();
    notifier.show({
      title: 'Goal Reached! 🎉',
      body: `Congratulations on completing "${goal.title}"!`,
      icon: '🏆',
      duration: 6000
    });

    // If repeatable, roll over to new cycle
    if (goal.repeat !== 'one-time') {
      finalCount = 0;
    }
  } else {
    notifier.show({
      title: 'Progress Recorded!',
      body: `"${goal.title}" is now at ${nextCount}/${goal.targetCount}.`,
      icon: '✓'
    });
  }

  const now = Date.now();
  const nextStreak = (goal.streak || 0) + 1;

  store.setState(s => ({
    ...s,
    goals: s.goals.map(g => g.id === goalId ? {
      ...g,
      currentCount: finalCount,
      cyclesCompleted: nextCycles,
      streak: nextStreak,
      lastCheckIn: now,
      checkInHistory: [now, ...(g.checkInHistory || [])]
    } : g)
  }), 'goal_checkin');
}

export function undoGoalCheckIn(goalId) {
  const state = store.getState();
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal || !goal.lastCheckIn) return;

  const diff = Date.now() - goal.lastCheckIn;
  if (diff > UNDO_WINDOW_MS) {
    notifier.show({
      title: 'Undo Window Expired',
      body: 'Check-ins can only be undone within 5 minutes.',
      icon: '⚠️'
    });
    return;
  }

  deskAudio.playClick();
  const prevCount = Math.max(0, goal.currentCount - 1);
  const prevHistory = (goal.checkInHistory || []).slice(1);
  const prevLast = prevHistory.length > 0 ? prevHistory[0] : null;

  store.setState(s => ({
    ...s,
    goals: s.goals.map(g => g.id === goalId ? {
      ...g,
      currentCount: prevCount,
      streak: Math.max(0, (g.streak || 1) - 1),
      lastCheckIn: prevLast,
      checkInHistory: prevHistory
    } : g)
  }), 'goal_undo');

  notifier.show({
    title: 'Check-in Undone',
    body: `Reverted "${goal.title}" back to ${prevCount}/${goal.targetCount}.`,
    icon: '↩'
  });
}

export function renderGoalsPreview() {
  const state = store.getState();
  const goals = state.goals || [];

  return `
    <div class="paper-card goals-card paper-pink" id="goals-paper">
      ${createPushpinSVG('var(--pin-color-3)', 'pin-right')}

      <div class="paper-header">
        <h3 class="paper-title" data-open-route="goals">
          ${renderIcon('target', 18)} Study Goals
        </h3>
        <button class="desk-btn desk-btn-sm" data-open-route="goals" title="Manage Goals & Shelf">
          ${renderIcon('maximize-2', 14)}
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${goals.slice(0, 3).map(goal => {
          const pct = Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100));
          const eligibility = checkGoalEligibility(goal);

          return `
            <div class="goal-item-preview">
              <div class="goal-preview-top">
                <span class="goal-preview-title">${escapeHTML(goal.title)}</span>
                <span class="goal-preview-count">${goal.currentCount}/${goal.targetCount}</span>
              </div>
              <div class="desk-progress-track">
                <div class="desk-progress-fill" style="width: ${pct}%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                <span style="font-size: 0.72rem; color: var(--ink-muted);">
                  🔥 ${goal.streak || 0} streak • ${goal.cyclesCompleted || 0} cycles
                </span>
                <div>
                  ${eligibility.canUndo ? `
                    <button class="desk-btn desk-btn-sm" data-goal-undo="${goal.id}" title="Undo last check-in">
                      ${renderIcon('undo', 12)} Undo
                    </button>
                  ` : ''}
                  <button class="desk-btn desk-btn-sm desk-btn-highlight" data-goal-checkin="${goal.id}" ${!eligibility.canCheckIn ? 'disabled' : ''}>
                    ${eligibility.canCheckIn ? `${renderIcon('check', 12)} Done for today!` : `Come back in ${eligibility.hoursRemaining}h ${eligibility.minsRemaining}m`}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderGoalsDetail() {
  const state = store.getState();
  const goals = state.goals || [];
  const knownSubjects = state.folders.map(f => f.name);

  return {
    title: `${renderIcon('target', 22)} Study Goals & Completed Shelf`,
    body: `
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h4 style="font-family: var(--font-hand); font-size: 1.5rem; margin: 0;">Active Study Goals</h4>
          <button type="button" class="desk-btn desk-btn-primary desk-btn-sm" id="btn-create-goal-toggle">
            ${renderIcon('plus', 14)} Add New Goal
          </button>
        </div>

        <form id="new-goal-form" style="display: none; background: rgba(0,0,0,0.03); padding: 16px; border-radius: var(--radius-md); margin-bottom: 16px;">
          <div class="desk-field-group">
            <label class="desk-label" for="goal-title-input">Goal Title *</label>
            <input type="text" id="goal-title-input" class="desk-input" required placeholder="e.g. Complete 20 Physics Practice Problems">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div class="desk-field-group">
              <label class="desk-label" for="goal-target-input">Target Count</label>
              <input type="number" id="goal-target-input" class="desk-input" min="1" value="10" required>
            </div>
            <div class="desk-field-group">
              <label class="desk-label" for="goal-subject-input">Subject</label>
              <select id="goal-subject-input" class="desk-select">
                <option value="">General</option>
                ${knownSubjects.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('')}
              </select>
            </div>
            <div class="desk-field-group">
              <label class="desk-label" for="goal-repeat-input">Repeat Cycle</label>
              <select id="goal-repeat-input" class="desk-select">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>
          <button type="submit" class="desk-btn desk-btn-primary desk-btn-sm">Save Goal</button>
        </form>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100));
            const eligibility = checkGoalEligibility(goal);
            return `
              <div style="padding: 14px; background: #FFFFFF; border: 1px solid var(--ink-border); border-radius: var(--radius-md); box-shadow: var(--shadow-paper);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <h5 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 4px 0;">${escapeHTML(goal.title)}</h5>
                    <span class="desk-tag">${escapeHTML(goal.subject || 'General')}</span>
                    <span style="font-size: 0.78rem; color: var(--ink-muted); margin-left: 6px;">Repeat: ${goal.repeat}</span>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="desk-btn desk-btn-sm desk-btn-danger" data-delete-goal="${goal.id}" title="Delete goal">
                      ${renderIcon('trash-2', 14)}
                    </button>
                  </div>
                </div>

                <div style="margin: 12px 0 6px 0;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
                    <span>Progress: <strong>${goal.currentCount}/${goal.targetCount}</strong></span>
                    <span>${pct}%</span>
                  </div>
                  <div class="desk-progress-track">
                    <div class="desk-progress-fill" style="width: ${pct}%;"></div>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                  <span style="font-size: 0.82rem; color: var(--ink-secondary);">
                    🔥 Streak: <strong>${goal.streak || 0} days</strong> | Completed Cycles: <strong>${goal.cyclesCompleted || 0}</strong>
                  </span>
                  <div>
                    ${eligibility.canUndo ? `
                      <button class="desk-btn desk-btn-sm" data-goal-undo="${goal.id}">
                        ${renderIcon('undo', 12)} Undo
                      </button>
                    ` : ''}
                    <button class="desk-btn desk-btn-sm desk-btn-highlight" data-goal-checkin="${goal.id}" ${!eligibility.canCheckIn ? 'disabled' : ''}>
                      ${eligibility.canCheckIn ? `${renderIcon('check', 12)} Done for today!` : `Wait ${eligibility.hoursRemaining}h ${eligibility.minsRemaining}m`}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="margin-top: 28px;">
        <h4 style="font-family: var(--font-hand); font-size: 1.5rem; margin-bottom: 10px;">
          🏆 Completed Goals Shelf
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
          ${goals.filter(g => g.cyclesCompleted > 0).length === 0 ? `
            <p style="color: var(--ink-muted); font-size: 0.88rem;">No finished goals yet. Keep working towards your first trophy!</p>
          ` : goals.filter(g => g.cyclesCompleted > 0).map(g => `
            <div style="background: var(--paper-yellow); border: 1.5px dashed var(--stamp-ink); border-radius: var(--radius-md); padding: 12px; text-align: center;">
              <div style="font-size: 1.8rem;">🏆</div>
              <div style="font-family: var(--font-hand); font-size: 1.15rem; font-weight: bold; margin: 4px 0;">${escapeHTML(g.title)}</div>
              <div style="font-size: 0.75rem; color: var(--ink-secondary);">${g.cyclesCompleted} cycles mastered!</div>
            </div>
          `).join('')}
        </div>
      </div>
    `,
    footer: `
      <button class="desk-btn desk-btn-primary" data-close-modal>
        ${renderIcon('check', 16)} Done
      </button>
    `,
    onMount: (bodyEl) => {
      const toggleBtn = bodyEl.querySelector('#btn-create-goal-toggle');
      const form = bodyEl.querySelector('#new-goal-form');

      toggleBtn?.addEventListener('click', () => {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
      });

      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = bodyEl.querySelector('#goal-title-input').value.trim();
        const target = parseInt(bodyEl.querySelector('#goal-target-input').value, 10) || 10;
        const subject = bodyEl.querySelector('#goal-subject-input').value;
        const repeat = bodyEl.querySelector('#goal-repeat-input').value;

        if (!title) return;

        const newGoal = {
          id: `g-${Date.now()}`,
          title,
          targetCount: target,
          currentCount: 0,
          subject,
          repeat,
          streak: 0,
          cyclesCompleted: 0,
          lastCheckIn: null,
          createdAt: Date.now(),
          checkInHistory: []
        };

        store.setState(s => ({
          ...s,
          goals: [newGoal, ...s.goals]
        }), 'goal_created');

        notifier.show({
          title: 'Goal Pinned to Desk!',
          body: `Added "${title}"`,
          icon: '📌'
        });

        // Refresh modal view
        window.location.hash = '';
        setTimeout(() => window.location.hash = '#goals', 50);
      });

      bodyEl.querySelectorAll('[data-delete-goal]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.deleteGoal;
          if (confirm('Are you sure you want to remove this goal?')) {
            store.setState(s => ({
              ...s,
              goals: s.goals.filter(g => g.id !== id)
            }), 'goal_deleted');
            window.location.hash = '';
            setTimeout(() => window.location.hash = '#goals', 50);
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
