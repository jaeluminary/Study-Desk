/**
 * STUDY DESK - THEME ENGINE
 * Switches between Theme A and Theme B instantly without reload.
 */

import { store } from './store.js';

export function initTheme() {
  const currentTheme = store.getState().theme || 'theme-a';
  applyTheme(currentTheme);

  // Update header switcher UI
  const themeToggle = document.getElementById('theme-toggle-container');
  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-set-theme]');
      if (btn) {
        const selected = btn.dataset.setTheme;
        setTheme(selected);
      }
    });
  }
}

export function setTheme(themeName) {
  if (themeName !== 'theme-a' && themeName !== 'theme-b') return;
  applyTheme(themeName);
  store.setState(s => ({ ...s, theme: themeName }), 'theme_change');
}

export function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  
  // Highlight active button in header if present
  document.querySelectorAll('[data-set-theme]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.setTheme === themeName);
  });
}
