/**
 * STUDY DESK - APPLICATION ORCHESTRATOR
 * Bootstraps the pinboard, registers routes, and binds interactive event delegates.
 */

import { store } from './core/store.js';
import { initTheme } from './core/theme.js';
import { deskAudio } from './core/audio.js';
import { modalRouter } from './components/modal.js';
import { notifier } from './components/notification.js';

// Feature Modules
import { renderFocusPreview, renderFocusDetail } from './features/focus.js';
import { renderTimerPreview, renderTimerDetail, initTimerEngine, startTimer, pauseTimer, resetTimer, setPreset } from './features/timer.js';
import { renderGoalsPreview, renderGoalsDetail, performGoalCheckIn, undoGoalCheckIn } from './features/goals.js';
import { renderMusicPreview, renderMusicDetail, initMusicPlayer, togglePlayPause } from './features/music.js';
import { renderMaterialsPreview, renderMaterialsDetail } from './features/materials.js';
import { renderScoresPreview, renderScoresDetail } from './features/scores.js';
import { renderRemindersPreview, renderRemindersDetail } from './features/reminders.js';
import { renderSettingsDetail, renderAuthDetail } from './features/accounts.js';

function bootstrap() {
  // 1. Initialize Theme & Notification System
  initTheme();
  notifier.init();

  // 2. Initialize Timer & Music Background Engines
  initTimerEngine();
  initMusicPlayer();

  // 3. Register Hash Modal Routes
  modalRouter.registerRoute('focus', renderFocusDetail);
  modalRouter.registerRoute('timer', renderTimerDetail);
  modalRouter.registerRoute('goals', renderGoalsDetail);
  modalRouter.registerRoute('music', renderMusicDetail);
  modalRouter.registerRoute('materials', renderMaterialsDetail);
  modalRouter.registerRoute('scores', renderScoresDetail);
  modalRouter.registerRoute('reminders', renderRemindersDetail);
  modalRouter.registerRoute('settings', renderSettingsDetail);
  modalRouter.registerRoute('auth', renderAuthDetail);

  modalRouter.init();

  // 4. Initial Render of the Pinboard Canvas
  renderPinboard();

  // 5. Subscribe to State Changes for Live UI Updates
  store.subscribe('*', ({ event }) => {
    // Only re-render previews when relevant state updates
    if (event !== 'timer_tick' && event !== 'music_tick') {
      renderPinboard();
    } else {
      // Lightweight update for timer and music digits/bars
      updateTimerDisplayOnly();
    }
  });

  // 6. Global Event Delegation
  bindGlobalDelegates();

  // Initialize Web Audio context on first user click anywhere
  window.addEventListener('click', () => deskAudio.init(), { once: true });
}

function renderPinboard() {
  const leftCol = document.getElementById('pinboard-col-left');
  const mainCol = document.getElementById('pinboard-col-main');

  if (!leftCol || !mainCol) return;

  // Left Column: Timer, Music, Score Tracker
  leftCol.innerHTML = `
    ${renderTimerPreview()}
    ${renderMusicPreview()}
    ${renderScoresPreview()}
  `;

  // Main / Right Area: Focus Postcard, Goals, Materials & Reminders
  mainCol.innerHTML = `
    ${renderFocusPreview()}
    <div class="pinboard-secondary-grid">
      ${renderGoalsPreview()}
      ${renderRemindersPreview()}
    </div>
    <div style="margin-top: 4px;">
      ${renderMaterialsPreview()}
    </div>
  `;
}

function updateTimerDisplayOnly() {
  const timerCard = document.getElementById('timer-paper');
  if (!timerCard) return;

  const state = store.getState();
  const digitsEl = timerCard.querySelector('.timer-digits-display');
  if (digitsEl) {
    const minutes = Math.floor(state.timer.remainingSeconds / 60);
    const seconds = state.timer.remainingSeconds % 60;
    digitsEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    digitsEl.classList.toggle('ticking', state.timer.isRunning);
  }

  const musicCard = document.getElementById('music-paper');
  if (musicCard) {
    const fillEl = musicCard.querySelector('.desk-progress-fill');
    if (fillEl) {
      const pct = Math.min(100, Math.round((state.music.progressMs / (state.music.durationMs || 1)) * 100));
      fillEl.style.width = `${pct}%`;
    }
  }
}

function bindGlobalDelegates() {
  document.addEventListener('click', (e) => {
    // 1. Open route trigger
    const routeTrigger = e.target.closest('[data-open-route]');
    if (routeTrigger && !e.target.closest('button:not([data-open-route])') && !e.target.closest('input')) {
      const route = routeTrigger.dataset.openRoute;
      window.location.hash = `#${route}`;
      return;
    }

    // 2. Timer Controls
    if (e.target.closest('#btn-timer-start')) {
      startTimer();
      return;
    }
    if (e.target.closest('#btn-timer-pause')) {
      pauseTimer();
      return;
    }
    if (e.target.closest('#btn-timer-reset')) {
      resetTimer();
      return;
    }
    const presetBtn = e.target.closest('[data-timer-preset]');
    if (presetBtn) {
      const min = parseInt(presetBtn.dataset.timerPreset, 10);
      setPreset(min);
      return;
    }

    // 3. Goal check-in / undo
    const checkInBtn = e.target.closest('[data-goal-checkin]');
    if (checkInBtn) {
      e.stopPropagation();
      const goalId = checkInBtn.dataset.goalCheckin;
      performGoalCheckIn(goalId);
      return;
    }

    const undoGoalBtn = e.target.closest('[data-goal-undo]');
    if (undoGoalBtn) {
      e.stopPropagation();
      const goalId = undoGoalBtn.dataset.goalUndo;
      undoGoalCheckIn(goalId);
      return;
    }

    // 4. Music play/pause
    if (e.target.closest('#btn-music-playpause')) {
      e.stopPropagation();
      togglePlayPause();
      return;
    }

    // 5. Reminder checkbox toggle
    const remToggle = e.target.closest('[data-toggle-rem]');
    if (remToggle) {
      e.stopPropagation();
      const id = remToggle.dataset.toggleRem;
      deskAudio.playClick();
      store.setState(s => ({
        ...s,
        reminders: s.reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
      }), 'reminder_toggled');
      return;
    }
  });
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
