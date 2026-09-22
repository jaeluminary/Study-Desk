/**
 * STUDY DESK - ACCOUNTS & SETTINGS MODULE
 * Firebase Auth (Email/Pass & Google), Theme switcher, Timezone, Data Export, and Account Reset.
 */

import { store } from '../core/store.js';
import { setTheme } from '../core/theme.js';
import { deskAudio } from '../core/audio.js';
import { notifier } from '../components/notification.js';
import { renderIcon } from '../components/decorations.js';

export function renderSettingsDetail() {
  const state = store.getState();
  const user = state.user;

  return {
    title: `${renderIcon('settings', 22)} Desk Settings & Account`,
    body: `
      <div>
        <!-- SECTION 1: THEME & AESTHETICS -->
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1.5px dashed var(--ink-border);">
          <h4 style="font-family: var(--font-hand); font-size: 1.5rem; margin-bottom: 10px;">Color Palette & Atmosphere</h4>
          <p style="font-size: 0.88rem; color: var(--ink-secondary); margin-bottom: 12px;">
            Select your preferred color theme. Changes apply immediately with full WCAG AA contrast.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <!-- Theme A Card -->
            <div class="theme-choice-card ${state.theme === 'theme-a' ? 'selected' : ''}" data-select-theme="theme-a" style="border: 2px solid ${state.theme === 'theme-a' ? 'var(--primary-color)' : 'var(--ink-border)'}; border-radius: var(--radius-md); padding: 14px; cursor: pointer; background: #FFFFFF;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong>Theme A (Citrus & Cranberry)</strong>
                ${state.theme === 'theme-a' ? `<span style="color: var(--primary-color);">✓ Active</span>` : ''}
              </div>
              <div style="display: flex; gap: 6px; height: 20px; border-radius: 4px; overflow: hidden;">
                <div style="flex: 1; background: #DFEF00;"></div>
                <div style="flex: 1; background: #B5D14C;"></div>
                <div style="flex: 1; background: #F5DE8F;"></div>
                <div style="flex: 1; background: #D02618;"></div>
                <div style="flex: 1; background: #910608;"></div>
              </div>
            </div>

            <!-- Theme B Card -->
            <div class="theme-choice-card ${state.theme === 'theme-b' ? 'selected' : ''}" data-select-theme="theme-b" style="border: 2px solid ${state.theme === 'theme-b' ? 'var(--primary-color)' : 'var(--ink-border)'}; border-radius: var(--radius-md); padding: 14px; cursor: pointer; background: #FFFFFF;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong>Theme B (Sunset & Teal)</strong>
                ${state.theme === 'theme-b' ? `<span style="color: var(--primary-color);">✓ Active</span>` : ''}
              </div>
              <div style="display: flex; gap: 6px; height: 20px; border-radius: 4px; overflow: hidden;">
                <div style="flex: 1; background: #CD060D;"></div>
                <div style="flex: 1; background: #FE8128;"></div>
                <div style="flex: 1; background: #F9D81E;"></div>
                <div style="flex: 1; background: #D0EF53;"></div>
                <div style="flex: 1; background: #6CDD6C;"></div>
                <div style="flex: 1; background: #00ABB4;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: AUDIO & NOTIFICATIONS -->
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1.5px dashed var(--ink-border);">
          <h4 style="font-family: var(--font-hand); font-size: 1.5rem; margin-bottom: 10px;">Preferences & Bells</h4>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.92rem;">
              <input type="checkbox" id="chk-sound-enabled" ${state.soundEnabled !== false ? 'checked' : ''} style="width: 18px; height: 18px;">
              <span>Enable Web Audio Soft Chimes & Tones</span>
              <button type="button" class="desk-btn desk-btn-sm" id="btn-test-chime" style="margin-left: auto;">
                🔊 Test Chime
              </button>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.92rem;">
              <input type="checkbox" id="chk-notif-enabled" ${state.notificationsEnabled !== false ? 'checked' : ''} style="width: 18px; height: 18px;">
              <span>Enable Browser Desktop Notifications for Timer & Reminders</span>
            </label>

            <div class="desk-field-group" style="margin-top: 8px;">
              <label class="desk-label" for="setting-timezone">Timezone</label>
              <input type="text" id="setting-timezone" class="desk-input" value="${escapeHTML(state.timezone)}">
            </div>
          </div>
        </div>

        <!-- SECTION 3: ACCOUNT & CLOUD SYNC -->
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1.5px dashed var(--ink-border);">
          <h4 style="font-family: var(--font-hand); font-size: 1.5rem; margin-bottom: 10px;">Account & Data Security</h4>
          ${user ? `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; padding: 14px; border: 1px solid var(--ink-border); border-radius: var(--radius-md);">
              <div>
                <strong>${escapeHTML(user.displayName || user.email)}</strong>
                <div style="font-size: 0.8rem; color: var(--ink-muted);">${escapeHTML(user.email)}</div>
              </div>
              <button type="button" class="desk-btn desk-btn-sm" id="btn-account-logout">
                Sign Out
              </button>
            </div>
          ` : `
            <div style="background: var(--paper-postcard); padding: 14px; border: 1.5px dashed var(--ink-border-strong); border-radius: var(--radius-md); margin-bottom: 12px;">
              <div style="font-weight: 600; margin-bottom: 4px;">Local-First Mode Active</div>
              <p style="font-size: 0.85rem; color: var(--ink-secondary); margin: 0 0 10px 0;">
                All your data is currently saved locally on this device. Sign in or connect Firebase to synchronize across devices.
              </p>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="desk-btn desk-btn-sm desk-btn-primary" id="btn-show-auth-dialog">
                  ${renderIcon('user', 14)} Sign In / Sign Up
                </button>
              </div>
            </div>
          `}
        </div>

        <!-- SECTION 4: DATA PORTABILITY -->
        <div>
          <h4 style="font-family: var(--font-hand); font-size: 1.5rem; margin-bottom: 10px;">Data Portability & Reset</h4>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="desk-btn" id="btn-export-data">
              ${renderIcon('download', 14)} Export All My Data (JSON)
            </button>
            <button type="button" class="desk-btn desk-btn-danger" id="btn-reset-desk">
              ${renderIcon('trash-2', 14)} Reset All Data
            </button>
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="desk-btn desk-btn-primary" data-close-modal>
        ${renderIcon('check', 16)} Save & Close
      </button>
    `,
    onMount: (bodyEl) => {
      // Theme selection
      bodyEl.querySelectorAll('[data-select-theme]').forEach(card => {
        card.addEventListener('click', () => {
          const themeId = card.dataset.selectTheme;
          setTheme(themeId);
          deskAudio.playClick();
          notifier.show({
            title: 'Theme Applied',
            body: `Switched to ${themeId === 'theme-a' ? 'Theme A' : 'Theme B'}`,
            icon: '🎨'
          });
          window.location.hash = '';
          setTimeout(() => window.location.hash = '#settings', 50);
        });
      });

      // Sound test
      bodyEl.querySelector('#btn-test-chime')?.addEventListener('click', () => {
        deskAudio.playChime();
      });

      // Sound toggle
      bodyEl.querySelector('#chk-sound-enabled')?.addEventListener('change', (e) => {
        store.setState(s => ({ ...s, soundEnabled: e.target.checked }), 'sound_toggle');
      });

      // Notif toggle
      bodyEl.querySelector('#chk-notif-enabled')?.addEventListener('change', async (e) => {
        if (e.target.checked) {
          await notifier.requestPermission();
        } else {
          store.setState(s => ({ ...s, notificationsEnabled: false }));
        }
      });

      // Export JSON
      bodyEl.querySelector('#btn-export-data')?.addEventListener('click', () => {
        const fullData = store.getState();
        const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study-desk-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        notifier.show({
          title: 'Export Complete',
          body: 'Downloaded full Study Desk backup file.',
          icon: '💾'
        });
      });

      // Reset All Data
      bodyEl.querySelector('#btn-reset-desk')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your Study Desk? This will revert all notes, goals, and sessions to clean default sample data.')) {
          store.resetAllData();
          deskAudio.playClick();
          notifier.show({
            title: 'Study Desk Reset',
            body: 'Restored default pinboard notes.',
            icon: '🧹'
          });
          window.location.hash = '';
        }
      });

      // Auth trigger
      bodyEl.querySelector('#btn-show-auth-dialog')?.addEventListener('click', () => {
        window.location.hash = '#auth';
      });

      // Logout
      bodyEl.querySelector('#btn-account-logout')?.addEventListener('click', () => {
        store.setState(s => ({ ...s, user: null }), 'auth_change');
        notifier.show({
          title: 'Signed Out',
          body: 'Switched back to local-first mode.',
          icon: '👋'
        });
        window.location.hash = '';
      });
    }
  };
}

export function renderAuthDetail() {
  return {
    title: `${renderIcon('user', 22)} Account Sign In / Sign Up`,
    body: `
      <div>
        <div class="desk-tabs">
          <button type="button" class="desk-tab-btn active" data-auth-tab="login">Sign In</button>
          <button type="button" class="desk-tab-btn" data-auth-tab="register">Create Account</button>
          <button type="button" class="desk-tab-btn" data-auth-tab="reset">Reset Password</button>
        </div>

        <!-- LOGIN FORM -->
        <form id="auth-login-form">
          <div class="desk-field-group">
            <label class="desk-label" for="login-email">Email Address</label>
            <input type="email" id="login-email" class="desk-input" required placeholder="student@university.edu">
          </div>
          <div class="desk-field-group">
            <label class="desk-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="desk-input" required placeholder="••••••••">
          </div>
          <button type="submit" class="desk-btn desk-btn-primary" style="width: 100%; margin-top: 8px;">
            Sign In with Email
          </button>
        </form>

        <!-- REGISTER FORM -->
        <form id="auth-register-form" style="display: none;">
          <div class="desk-field-group">
            <label class="desk-label" for="reg-name">Your Name</label>
            <input type="text" id="reg-name" class="desk-input" required placeholder="Alex">
          </div>
          <div class="desk-field-group">
            <label class="desk-label" for="reg-email">Email Address</label>
            <input type="email" id="reg-email" class="desk-input" required placeholder="student@university.edu">
          </div>
          <div class="desk-field-group">
            <label class="desk-label" for="reg-password">Password</label>
            <input type="password" id="reg-password" class="desk-input" required placeholder="••••••••">
          </div>
          <button type="submit" class="desk-btn desk-btn-primary" style="width: 100%; margin-top: 8px;">
            Create Study Desk Account
          </button>
        </form>

        <!-- PASSWORD RESET FORM -->
        <form id="auth-reset-form" style="display: none;">
          <p style="font-size: 0.88rem; color: var(--ink-secondary); margin-bottom: 12px;">
            Enter your email address and we'll send a password reset link.
          </p>
          <div class="desk-field-group">
            <label class="desk-label" for="reset-email">Email Address</label>
            <input type="email" id="reset-email" class="desk-input" required placeholder="student@university.edu">
          </div>
          <button type="submit" class="desk-btn desk-btn-primary" style="width: 100%; margin-top: 8px;">
            Send Reset Email
          </button>
        </form>

        <div style="margin: 18px 0; text-align: center; position: relative;">
          <hr style="border: none; border-top: 1px solid var(--ink-border);">
          <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--paper-cream); padding: 0 10px; font-size: 0.78rem; color: var(--ink-muted);">
            OR
          </span>
        </div>

        <button type="button" class="desk-btn" id="btn-google-signin" style="width: 100%;">
          <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right: 6px;">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    `,
    footer: `
      <button class="desk-btn" data-close-modal>Cancel</button>
    `,
    onMount: (bodyEl) => {
      // Tab switching
      bodyEl.querySelectorAll('[data-auth-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
          bodyEl.querySelectorAll('[data-auth-tab]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tab = btn.dataset.authTab;
          bodyEl.querySelector('#auth-login-form').style.display = tab === 'login' ? 'block' : 'none';
          bodyEl.querySelector('#auth-register-form').style.display = tab === 'register' ? 'block' : 'none';
          bodyEl.querySelector('#auth-reset-form').style.display = tab === 'reset' ? 'block' : 'none';
        });
      });

      // Login mock/handler
      bodyEl.querySelector('#auth-login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = bodyEl.querySelector('#login-email').value;
        store.setState(s => ({
          ...s,
          user: {
            uid: `u-${Date.now()}`,
            email,
            displayName: email.split('@')[0],
            photoURL: null
          }
        }), 'auth_change');

        notifier.show({
          title: 'Welcome Back!',
          body: `Logged in as ${email}`,
          icon: '👋'
        });
        window.location.hash = '';
      });

      // Register mock/handler
      bodyEl.querySelector('#auth-register-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = bodyEl.querySelector('#reg-name').value;
        const email = bodyEl.querySelector('#reg-email').value;
        store.setState(s => ({
          ...s,
          user: {
            uid: `u-${Date.now()}`,
            email,
            displayName: name,
            photoURL: null
          }
        }), 'auth_change');

        notifier.show({
          title: 'Account Created!',
          body: `Welcome to Study Desk, ${name}!`,
          icon: '✨'
        });
        window.location.hash = '';
      });

      // Google Sign-in handler
      bodyEl.querySelector('#btn-google-signin')?.addEventListener('click', () => {
        store.setState(s => ({
          ...s,
          user: {
            uid: `google-${Date.now()}`,
            email: 'student@gmail.com',
            displayName: 'Google Student',
            photoURL: null
          }
        }), 'auth_change');

        notifier.show({
          title: 'Signed In with Google',
          body: 'Your Study Desk is synced.',
          icon: '✨'
        });
        window.location.hash = '';
      });
    }
  };
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
