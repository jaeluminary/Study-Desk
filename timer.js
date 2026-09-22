/**
 * STUDY DESK - TIMER MODULE
 * Timestamp-accurate chronometer, Pomodoro intervals, chime synthesizer, and SVG weekly charts.
 */

import { store } from '../core/store.js';
import { deskAudio } from '../core/audio.js';
import { notifier } from '../components/notification.js';
import { createPushpinSVG, createWashiTape, renderIcon } from '../components/decorations.js';

let intervalId = null;

export function initTimerEngine() {
  const state = store.getState();
  if (state.timer.isRunning && state.timer.targetEndTime) {
    startTickLoop();
  }
}

function startTickLoop() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(checkTimerTick, 500);
}

function stopTickLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function checkTimerTick() {
  const state = store.getState();
  if (!state.timer.isRunning || !state.timer.targetEndTime) {
    stopTickLoop();
    return;
  }

  const now = Date.now();
  const diffMs = state.timer.targetEndTime - now;
  const remainingSec = Math.max(0, Math.ceil(diffMs / 1000));

  if (remainingSec <= 0) {
    // Timer finished!
    stopTickLoop();
    handleTimerComplete();
  } else {
    store.setState(s => ({
      ...s,
      timer: { ...s.timer, remainingSeconds: remainingSec }
    }), 'timer_tick');
  }
}

function handleTimerComplete() {
  const state = store.getState();
  const durationMin = state.timer.presetMinutes;
  const subject = state.focus.currentSubject || 'General Study';

  // Play synthesized chime
  deskAudio.playChime();

  // Send notification
  notifier.show({
    title: 'Study Session Finished!',
    body: `Great job completing ${durationMin}m on ${subject}. Time for a well-deserved break!`,
    icon: '🔔',
    duration: 6000
  });

  // Log completed session
  const newSession = {
    id: `ts-${Date.now()}`,
    subject,
    durationMinutes: durationMin,
    completedAt: Date.now()
  };

  store.setState(s => ({
    ...s,
    timer: {
      ...s.timer,
      isRunning: false,
      startedAt: null,
      targetEndTime: null,
      remainingSeconds: s.timer.presetMinutes * 60,
      totalSessionsCompleted: (s.timer.totalSessionsCompleted || 0) + 1,
      sessions: [newSession, ...s.timer.sessions]
    }
  }), 'timer_complete');
}

export function startTimer() {
  const state = store.getState();
  const seconds = state.timer.remainingSeconds > 0 ? state.timer.remainingSeconds : state.timer.presetMinutes * 60;
  const targetEndTime = Date.now() + (seconds * 1000);

  deskAudio.playClick();
  store.setState(s => ({
    ...s,
    timer: {
      ...s.timer,
      isRunning: true,
      startedAt: Date.now(),
      targetEndTime,
      remainingSeconds: seconds
    }
  }), 'timer_start');

  startTickLoop();
}

export function pauseTimer() {
  const state = store.getState();
  if (!state.timer.isRunning) return;

  const now = Date.now();
  const remainingSeconds = Math.max(0, Math.ceil((state.timer.targetEndTime - now) / 1000));

  deskAudio.playClick();
  stopTickLoop();

  store.setState(s => ({
    ...s,
    timer: {
      ...s.timer,
      isRunning: false,
      startedAt: null,
      targetEndTime: null,
      remainingSeconds
    }
  }), 'timer_pause');
}

export function resetTimer() {
  deskAudio.playClick();
  stopTickLoop();
  store.setState(s => ({
    ...s,
    timer: {
      ...s.timer,
      isRunning: false,
      startedAt: null,
      targetEndTime: null,
      remainingSeconds: s.timer.presetMinutes * 60
    }
  }), 'timer_reset');
}

export function setPreset(minutes) {
  deskAudio.playClick();
  stopTickLoop();
  store.setState(s => ({
    ...s,
    timer: {
      ...s.timer,
      isRunning: false,
      startedAt: null,
      targetEndTime: null,
      presetMinutes: minutes,
      remainingSeconds: minutes * 60
    }
  }), 'timer_preset_change');
}

export function renderTimerPreview() {
  const state = store.getState();
  const timer = state.timer;
  const minutes = Math.floor(timer.remainingSeconds / 60);
  const seconds = timer.remainingSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return `
    <div class="paper-card timer-card paper-yellow" id="timer-paper">
      ${createPushpinSVG('var(--pin-color-2)', 'pin-left')}
      
      <div class="paper-header">
        <h3 class="paper-title" data-open-route="timer">
          ${renderIcon('clock', 18)} Study Timer
        </h3>
        <button class="desk-btn desk-btn-sm" data-open-route="timer" title="Open stats & settings">
          ${renderIcon('maximize-2', 14)}
        </button>
      </div>

      <div class="timer-digits-display ${timer.isRunning ? 'ticking' : ''}">
        ${timeStr}
      </div>

      <div class="timer-presets">
        ${[15, 25, 45, 60].map(m => `
          <button class="desk-btn desk-btn-sm ${timer.presetMinutes === m && !timer.isRunning ? 'desk-btn-highlight' : ''}" data-timer-preset="${m}">
            ${m}m
          </button>
        `).join('')}
      </div>

      <div class="timer-controls-row">
        ${!timer.isRunning ? `
          <button class="desk-btn desk-btn-primary" id="btn-timer-start">
            ${renderIcon('play', 16)} Start
          </button>
        ` : `
          <button class="desk-btn desk-btn-secondary" id="btn-timer-pause">
            ${renderIcon('pause', 16)} Pause
          </button>
        `}
        <button class="desk-btn" id="btn-timer-reset" title="Reset to preset">
          ${renderIcon('rotate-ccw', 16)}
        </button>
      </div>
    </div>
  `;
}

export function renderTimerDetail() {
  const state = store.getState();
  const timer = state.timer;
  const sessions = timer.sessions || [];

  // Calculate analytics
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const todayMinutes = sessions
    .filter(s => s.completedAt >= todayStart.getTime())
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const weekMinutes = sessions
    .filter(s => s.completedAt >= weekStart.getTime())
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  // Group by day for the last 7 days
  const dailyHours = [0, 0, 0, 0, 0, 0, 0];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    d.setHours(0,0,0,0);
    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);

    const minOnDay = sessions
      .filter(s => s.completedAt >= d.getTime() && s.completedAt < nextD.getTime())
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    dailyHours[6 - i] = {
      label: dayLabels[d.getDay()],
      hours: Number((minOnDay / 60).toFixed(1))
    };
  }

  const maxHours = Math.max(3, ...dailyHours.map(d => d.hours));

  return {
    title: `${renderIcon('clock', 22)} Study Timer & Analytics`,
    body: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="padding: 14px; background: rgba(0,0,0,0.03); border-radius: var(--radius-md); text-align: center;">
          <div style="font-size: 0.8rem; color: var(--ink-muted); text-transform: uppercase; font-weight: 700;">Today's Study Time</div>
          <div style="font-family: var(--font-hand); font-size: 2.2rem; font-weight: bold; color: var(--primary-color);">
            ${(todayMinutes / 60).toFixed(1)} hrs
          </div>
          <div style="font-size: 0.8rem; color: var(--ink-secondary);">${todayMinutes} mins logged</div>
        </div>

        <div style="padding: 14px; background: rgba(0,0,0,0.03); border-radius: var(--radius-md); text-align: center;">
          <div style="font-size: 0.8rem; color: var(--ink-muted); text-transform: uppercase; font-weight: 700;">Past 7 Days</div>
          <div style="font-family: var(--font-hand); font-size: 2.2rem; font-weight: bold; color: var(--secondary-color);">
            ${(weekMinutes / 60).toFixed(1)} hrs
          </div>
          <div style="font-size: 0.8rem; color: var(--ink-secondary);">${sessions.length} total sessions</div>
        </div>
      </div>

      <h4 style="font-family: var(--font-hand); font-size: 1.4rem; margin-bottom: 8px;">Weekly Study Trend (Hours)</h4>
      <!-- SVG Weekly Bar Chart -->
      <div style="background: #FFFFFF; border: 1px solid var(--ink-border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
        <svg viewBox="0 0 400 160" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
          <!-- Grid lines -->
          <line x1="40" y1="20" x2="380" y2="20" stroke="rgba(0,0,0,0.08)" stroke-dasharray="2 2"/>
          <line x1="40" y1="70" x2="380" y2="70" stroke="rgba(0,0,0,0.08)" stroke-dasharray="2 2"/>
          <line x1="40" y1="120" x2="380" y2="120" stroke="rgba(0,0,0,0.15)"/>
          
          ${dailyHours.map((d, idx) => {
            const x = 50 + idx * 48;
            const barH = (d.hours / maxHours) * 95;
            const y = 120 - barH;
            return `
              <rect x="${x}" y="${y}" width="28" height="${barH}" rx="4" fill="var(--primary-color)" opacity="0.85"/>
              <text x="${x + 14}" y="${y - 4}" font-size="10" font-family="sans-serif" font-weight="bold" fill="var(--ink-secondary)" text-anchor="middle">${d.hours}h</text>
              <text x="${x + 14}" y="136" font-size="11" font-family="sans-serif" fill="var(--ink-muted)" text-anchor="middle">${d.label}</text>
            `;
          }).join('')}
        </svg>
      </div>

      <h4 style="font-family: var(--font-hand); font-size: 1.4rem; margin-bottom: 8px;">Recent Completed Sessions</h4>
      <div style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
        ${sessions.length === 0 ? '<p style="color: var(--ink-muted);">No study sessions logged yet.</p>' : ''}
        ${sessions.map(s => `
          <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: rgba(0,0,0,0.02); border-radius: var(--radius-sm); font-size: 0.88rem;">
            <div>
              <strong>${escapeHTML(s.subject)}</strong>
              <span style="color: var(--ink-muted); margin-left: 6px;">${new Date(s.completedAt).toLocaleDateString()} ${new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span class="desk-tag">${s.durationMinutes} min</span>
          </div>
        `).join('')}
      </div>
    `,
    footer: `
      <button class="desk-btn desk-btn-primary" data-close-modal>
        ${renderIcon('check', 16)} Close
      </button>
    `
  };
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
