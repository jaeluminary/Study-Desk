/**
 * STUDY DESK - REMINDERS & TO-DO MODULE
 * Task lists, subtask checklists, priorities, smart filter views (Today, Upcoming, Overdue, Done).
 */

import { store } from '../core/store.js';
import { deskAudio } from '../core/audio.js';
import { notifier } from '../components/notification.js';
import { createPushpinSVG, createWashiTape, renderIcon } from '../components/decorations.js';

export function renderRemindersPreview() {
  const state = store.getState();
  const reminders = state.reminders || [];
  const activeList = reminders.filter(r => !r.completed);

  return `
    <div class="paper-card reminders-card paper-pink lined" id="reminders-paper">
      ${createPushpinSVG('var(--pin-color-3)', 'pin-right')}

      <div class="paper-header">
        <h3 class="paper-title" data-open-route="reminders">
          ${renderIcon('bell', 18)} Reminders & Tasks
        </h3>
        <button class="desk-btn desk-btn-sm" data-open-route="reminders" title="Open Task Manager">
          ${renderIcon('maximize-2', 14)}
        </button>
      </div>

      <div class="reminder-preview-list">
        ${activeList.slice(0, 3).map(rem => {
          const isOverdue = rem.dueDate && new Date(rem.dueDate).getTime() < Date.now();
          return `
            <div class="reminder-item-compact">
              <button class="reminder-check-square ${rem.completed ? 'checked' : ''}" data-toggle-rem="${rem.id}">
                ${rem.completed ? renderIcon('check', 12) : ''}
              </button>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 0.88rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${isOverdue ? 'var(--dark-accent)' : 'inherit'};">
                  ${isOverdue ? '⚠️ ' : ''}${escapeHTML(rem.title)}
                </div>
              </div>
              <span class="desk-tag" style="font-size: 0.68rem;">${escapeHTML(rem.subject || 'General')}</span>
            </div>
          `;
        }).join('')}
        ${activeList.length === 0 ? '<p style="font-size: 0.85rem; color: var(--ink-muted); text-align: center; padding: 10px 0;">All caught up for today! 🎉</p>' : ''}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
        <span style="font-size: 0.72rem; color: var(--ink-muted);">
          ${activeList.length} remaining
        </span>
        <button class="desk-btn desk-btn-sm desk-btn-primary" data-open-route="reminders">
          ${renderIcon('plus', 12)} Add Task
        </button>
      </div>
    </div>
  `;
}

export function renderRemindersDetail() {
  const state = store.getState();
  const reminders = state.reminders || [];
  const knownSubjects = state.folders.map(f => f.name);

  return {
    title: `${renderIcon('bell', 22)} Study Desk Reminders & Checklists`,
    body: `
      <div>
        <div class="desk-tabs">
          <button type="button" class="desk-tab-btn active" data-filter="all">All Tasks</button>
          <button type="button" class="desk-tab-btn" data-filter="today">Today</button>
          <button type="button" class="desk-tab-btn" data-filter="upcoming">Upcoming</button>
          <button type="button" class="desk-tab-btn" data-filter="overdue">Overdue</button>
          <button type="button" class="desk-tab-btn" data-filter="done">Completed</button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h4 style="font-family: var(--font-hand); font-size: 1.4rem; margin: 0;">Task Checklist</h4>
          <button type="button" class="desk-btn desk-btn-sm desk-btn-primary" id="btn-toggle-add-rem">
            ${renderIcon('plus', 14)} New Reminder
          </button>
        </div>

        <!-- Add Task Form -->
        <form id="new-reminder-form" style="display: none; background: rgba(0,0,0,0.03); padding: 16px; border-radius: var(--radius-md); margin-bottom: 18px; border: 1.5px dashed var(--ink-border-strong);">
          <div class="desk-field-group">
            <label class="desk-label" for="rem-title-input">Task Title *</label>
            <input type="text" id="rem-title-input" class="desk-input" required placeholder="e.g. Read Section 4.2 in Organic Chemistry">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div>
              <label class="desk-label" for="rem-subject-input">Subject</label>
              <select id="rem-subject-input" class="desk-select">
                <option value="General">General</option>
                ${knownSubjects.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="desk-label" for="rem-due-input">Due Date & Time</label>
              <input type="datetime-local" id="rem-due-input" class="desk-input">
            </div>
            <div>
              <label class="desk-label" for="rem-priority-input">Priority</label>
              <select id="rem-priority-input" class="desk-select">
                <option value="low">Low Priority</option>
                <option value="medium" selected>Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <button type="submit" class="desk-btn desk-btn-primary desk-btn-sm">Add Reminder</button>
        </form>

        <!-- Tasks List Container -->
        <div id="reminders-detail-list" style="display: flex; flex-direction: column; gap: 10px;">
          ${reminders.map(rem => renderReminderDetailItem(rem)).join('')}
        </div>
      </div>
    `,
    footer: `
      <button class="desk-btn desk-btn-primary" data-close-modal>
        ${renderIcon('check', 16)} Done
      </button>
    `,
    onMount: (bodyEl) => {
      // Add toggle
      const toggleBtn = bodyEl.querySelector('#btn-toggle-add-rem');
      const addForm = bodyEl.querySelector('#new-reminder-form');
      toggleBtn?.addEventListener('click', () => {
        addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
      });

      // Submit
      addForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = bodyEl.querySelector('#rem-title-input').value.trim();
        const subject = bodyEl.querySelector('#rem-subject-input').value;
        const dueDate = bodyEl.querySelector('#rem-due-input').value;
        const priority = bodyEl.querySelector('#rem-priority-input').value;

        if (!title) return;

        const newRem = {
          id: `rem-${Date.now()}`,
          title,
          subject,
          dueDate: dueDate || null,
          priority,
          completed: false,
          subtasks: []
        };

        deskAudio.playClick();
        store.setState(s => ({
          ...s,
          reminders: [newRem, ...s.reminders]
        }), 'reminder_created');

        notifier.show({
          title: 'Reminder Pinned!',
          body: `Added task "${title}"`,
          icon: '📌'
        });

        window.location.hash = '';
        setTimeout(() => window.location.hash = '#reminders', 50);
      });

      // Filter tabs
      bodyEl.querySelectorAll('.desk-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          bodyEl.querySelectorAll('.desk-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.dataset.filter;
          filterRemindersList(bodyEl, filter);
        });
      });

      bindReminderDetailEvents(bodyEl);
    }
  };
}

function renderReminderDetailItem(rem) {
  const isOverdue = rem.dueDate && new Date(rem.dueDate).getTime() < Date.now() && !rem.completed;
  const priorityColors = {
    high: 'var(--accent-4)',
    medium: 'var(--accent-2)',
    low: 'var(--ink-muted)'
  };

  return `
    <div class="reminder-item-full" data-rem-id="${rem.id}" style="background: #FFFFFF; border: 1px solid var(--ink-border); border-radius: var(--radius-md); padding: 12px 14px; box-shadow: var(--shadow-paper);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
          <button class="reminder-check-square ${rem.completed ? 'checked' : ''}" data-toggle-rem="${rem.id}" style="width: 20px; height: 20px;">
            ${rem.completed ? renderIcon('check', 14) : ''}
          </button>
          <div>
            <span style="font-size: 1rem; font-weight: 600; text-decoration: ${rem.completed ? 'line-through' : 'none'}; color: ${rem.completed ? 'var(--ink-muted)' : 'var(--ink-primary)'};">
              ${escapeHTML(rem.title)}
            </span>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 0.78rem;">
              <span class="desk-tag">${escapeHTML(rem.subject || 'General')}</span>
              ${rem.dueDate ? `<span style="color: ${isOverdue ? 'var(--dark-accent)' : 'var(--ink-muted)'}; font-weight: ${isOverdue ? '700' : 'normal'};">⏰ ${rem.dueDate.replace('T', ' ')} ${isOverdue ? '(Overdue!)' : ''}</span>` : ''}
              <span style="color: ${priorityColors[rem.priority] || 'var(--ink-muted)'}; font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">• ${rem.priority}</span>
            </div>
          </div>
        </div>
        <div>
          <button type="button" class="desk-btn desk-btn-sm desk-btn-danger" data-delete-rem="${rem.id}" title="Delete reminder">
            ${renderIcon('trash-2', 12)}
          </button>
        </div>
      </div>
    </div>
  `;
}

function filterRemindersList(bodyEl, filter) {
  const state = store.getState();
  const listEl = bodyEl.querySelector('#reminders-detail-list');
  const now = Date.now();
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  let filtered = state.reminders;
  if (filter === 'today') {
    filtered = state.reminders.filter(r => !r.completed && r.dueDate && new Date(r.dueDate).getTime() <= todayEnd.getTime());
  } else if (filter === 'upcoming') {
    filtered = state.reminders.filter(r => !r.completed && r.dueDate && new Date(r.dueDate).getTime() > todayEnd.getTime());
  } else if (filter === 'overdue') {
    filtered = state.reminders.filter(r => !r.completed && r.dueDate && new Date(r.dueDate).getTime() < now);
  } else if (filter === 'done') {
    filtered = state.reminders.filter(r => r.completed);
  }

  listEl.innerHTML = filtered.map(r => renderReminderDetailItem(r)).join('');
  bindReminderDetailEvents(bodyEl);
}

function bindReminderDetailEvents(bodyEl) {
  bodyEl.querySelectorAll('[data-toggle-rem]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.toggleRem;
      deskAudio.playClick();
      store.setState(s => ({
        ...s,
        reminders: s.reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
      }), 'reminder_toggled');

      const activeFilter = bodyEl.querySelector('.desk-tab-btn.active')?.dataset.filter || 'all';
      filterRemindersList(bodyEl, activeFilter);
    });
  });

  bodyEl.querySelectorAll('[data-delete-rem]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deleteRem;
      if (confirm('Delete this task?')) {
        deskAudio.playClick();
        store.setState(s => ({
          ...s,
          reminders: s.reminders.filter(r => r.id !== id)
        }), 'reminder_deleted');
        const activeFilter = bodyEl.querySelector('.desk-tab-btn.active')?.dataset.filter || 'all';
        filterRemindersList(bodyEl, activeFilter);
      }
    });
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
