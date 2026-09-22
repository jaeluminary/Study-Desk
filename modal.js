/**
 * STUDY DESK - DETAIL MODAL & URL HASH ROUTER
 * Expands paper previews into rich detail views and synchronizes browser URL.
 */

import { renderIcon } from './decorations.js';

class ModalRouter {
  constructor() {
    this.backdrop = null;
    this.card = null;
    this.titleEl = null;
    this.bodyEl = null;
    this.footerEl = null;
    this.currentRoute = null;
    this.routes = new Map();
  }

  init() {
    this.backdrop = document.getElementById('desk-modal-backdrop');
    this.card = document.getElementById('desk-modal-card');
    this.titleEl = document.getElementById('desk-modal-title');
    this.bodyEl = document.getElementById('desk-modal-body');
    this.footerEl = document.getElementById('desk-modal-footer');

    // Close buttons & backdrop click
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    this.backdrop?.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close();
    });

    // Listen to hash changes for bookmarkable URLs
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();
  }

  registerRoute(hashKey, rendererFn) {
    this.routes.set(hashKey.replace('#', ''), rendererFn);
  }

  handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      if (this.isOpen()) this.closeModalDOM();
      return;
    }

    const renderer = this.routes.get(hash);
    if (renderer) {
      this.open(hash, renderer);
    }
  }

  open(routeKey, rendererFn) {
    this.currentRoute = routeKey;
    if (window.location.hash !== `#${routeKey}`) {
      history.pushState(null, '', `#${routeKey}`);
    }

    if (!this.backdrop) return;

    // Render content
    const viewData = rendererFn();
    this.titleEl.innerHTML = viewData.title || 'Detail View';
    this.bodyEl.innerHTML = viewData.body || '';
    this.footerEl.innerHTML = viewData.footer || `
      <button class="desk-btn desk-btn-primary" data-close-modal>
        ${renderIcon('check', 16)} Done
      </button>
    `;

    // Rebind close listeners in footer
    this.footerEl.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Post-render hook for interactive buttons within the modal
    if (viewData.onMount) {
      setTimeout(() => viewData.onMount(this.bodyEl, this.footerEl), 0);
    }

    this.backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (window.location.hash) {
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
    this.closeModalDOM();
  }

  closeModalDOM() {
    this.backdrop?.classList.remove('active');
    document.body.style.overflow = '';
    this.currentRoute = null;
  }

  isOpen() {
    return this.backdrop?.classList.contains('active') || false;
  }
}

export const modalRouter = new ModalRouter();
