/**
 * STUDY DESK - NOTIFICATION SYSTEM
 * Handles browser desktop notifications and in-app paper toasts.
 */

import { store } from '../core/store.js';

class NotificationService {
  constructor() {
    this.container = null;
  }

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'desk-toast-container';
      this.container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }

  async requestPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      store.setState(s => ({ ...s, notificationsEnabled: perm === 'granted' }));
      return perm === 'granted';
    }
    return Notification.permission === 'granted';
  }

  show({ title, body, icon = '★', duration = 4000 }) {
    this.init();

    // 1. In-app paper toast
    const toast = document.createElement('div');
    toast.className = 'desk-toast paper-card paper-yellow';
    toast.style.cssText = `
      pointer-events: auto;
      min-width: 280px;
      max-width: 360px;
      padding: 12px 16px;
      border: 1.5px dashed var(--ink-border-strong);
      box-shadow: var(--shadow-paper-hover);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: modalCardPop 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
    `;

    toast.innerHTML = `
      <div style="font-size: 1.5rem; color: var(--primary-color);">${icon}</div>
      <div style="flex: 1;">
        <div style="font-family: var(--font-hand); font-size: 1.15rem; font-weight: bold; color: var(--ink-primary);">${title}</div>
        <div style="font-size: 0.82rem; color: var(--ink-secondary); margin-top: 2px;">${body}</div>
      </div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    // 2. Browser Desktop Notification (if enabled)
    const state = store.getState();
    if (state.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Study Desk: ${title}`, {
          body,
          tag: 'study-desk-alert'
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }
  }
}

export const notifier = new NotificationService();
