/**
 * STUDY DESK - MATERIALS MODULE ("Hall of Materials")
 * Notes (Markdown/autosave), Documents (PDF/image previews/uploads), Links,
 * Folders by subject, Gemini AI auto-sorting with Undo/Override, and batch organization.
 */

import { store } from '../core/store.js';
import { suggestSubjectForMaterial } from '../core/gemini.js';
import { deskAudio } from '../core/audio.js';
import { notifier } from '../components/notification.js';
import { createPushpinSVG, createWashiTape, renderIcon, createArtworkPlaceholder } from '../components/decorations.js';

export function renderMaterialsPreview() {
  const state = store.getState();
  const mats = state.materials || [];
  const notesCount = mats.filter(m => m.type === 'note').length;
  const docsCount = mats.filter(m => m.type === 'document').length;
  const linksCount = mats.filter(m => m.type === 'link').length;

  return `
    <div class="paper-card materials-card paper-green" id="materials-paper">
      ${createPushpinSVG('var(--pin-color-2)', 'pin-left')}
      
      <div class="paper-header">
        <h3 class="paper-title" data-open-route="materials">
          ${renderIcon('book-open', 18)} Hall of Materials
        </h3>
        <button class="desk-btn desk-btn-sm" data-open-route="materials" title="Open Hall of Materials">
          ${renderIcon('maximize-2', 14)}
        </button>
      </div>

      <p style="font-size: 0.85rem; color: var(--ink-secondary); margin-bottom: 8px;">
        Curated notes, slides, documents, and reference tools organized by subject.
      </p>

      <div class="materials-summary-grid">
        <div class="mat-stat-box">
          <div class="mat-stat-num">${notesCount}</div>
          <div class="mat-stat-lbl">Notes</div>
        </div>
        <div class="mat-stat-box">
          <div class="mat-stat-num">${docsCount}</div>
          <div class="mat-stat-lbl">Docs & PDFs</div>
        </div>
        <div class="mat-stat-box">
          <div class="mat-stat-num">${linksCount}</div>
          <div class="mat-stat-lbl">Links</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
        <span style="font-size: 0.72rem; color: var(--ink-muted);">
          🤖 AI Auto-Sorted
        </span>
        <button class="desk-btn desk-btn-sm desk-btn-primary" data-open-route="materials">
          ${renderIcon('plus', 12)} Add Material
        </button>
      </div>
    </div>
  `;
}

export function renderMaterialsDetail() {
  const state = store.getState();
  const mats = state.materials || [];
  const folders = state.folders || [];

  return {
    title: `${renderIcon('book-open', 22)} Hall of Materials`,
    body: `
      <div>
        <!-- Top Toolbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
          <div style="display: flex; gap: 8px; flex: 1; min-width: 240px;">
            <input type="text" id="mat-search-input" class="desk-input" placeholder="Search notes, docs, tags...">
            <select id="mat-filter-type" class="desk-select" style="width: 130px;">
              <option value="all">All Types</option>
              <option value="note">Notes</option>
              <option value="document">Documents</option>
              <option value="link">Links</option>
            </select>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="desk-btn desk-btn-sm desk-btn-highlight" id="btn-batch-ai-sort" title="AI Auto-Organize unfiled items">
              ${renderIcon('sparkles', 14)} Sort My Materials
            </button>
            <button type="button" class="desk-btn desk-btn-sm desk-btn-primary" id="btn-toggle-add-mat">
              ${renderIcon('plus', 14)} New Material
            </button>
          </div>
        </div>

        <!-- Add Material Collapsible Form -->
        <form id="new-material-form" style="display: none; background: rgba(0,0,0,0.03); padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px; border: 1.5px dashed var(--ink-border-strong);">
          <h4 style="font-family: var(--font-hand); font-size: 1.4rem; margin-bottom: 10px;">Add New Study Material</h4>
          
          <div style="display: grid; grid-template-columns: 1fr 140px; gap: 12px; margin-bottom: 12px;">
            <div>
              <label class="desk-label" for="mat-new-title">Material Title *</label>
              <input type="text" id="mat-new-title" class="desk-input" required placeholder="e.g. Thermodynamics Formula Cheat Sheet">
            </div>
            <div>
              <label class="desk-label" for="mat-new-type">Type</label>
              <select id="mat-new-type" class="desk-select">
                <option value="note">Note (Markdown)</option>
                <option value="document">Document (Upload)</option>
                <option value="link">Web Link</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div>
              <label class="desk-label" for="mat-new-subject">Subject (or leave empty for AI Auto-Sort)</label>
              <input type="text" id="mat-new-subject" class="desk-input" placeholder="e.g. Physics, Chemistry..." list="mat-subject-options">
              <datalist id="mat-subject-options">
                ${folders.map(f => `<option value="${escapeHTML(f.name)}">`).join('')}
              </datalist>
            </div>
            <div>
              <label class="desk-label" for="mat-new-tags">Tags (comma separated)</label>
              <input type="text" id="mat-new-tags" class="desk-input" placeholder="e.g. Formulas, Exam, Summary">
            </div>
          </div>

          <div id="mat-content-container" style="margin-bottom: 12px;">
            <label class="desk-label" for="mat-new-content">Content / Markdown Note</label>
            <textarea id="mat-new-content" class="desk-textarea" rows="4" placeholder="# Key Concepts&#10;- Point 1&#10;- Point 2"></textarea>
          </div>

          <div id="mat-file-upload-container" style="display: none; margin-bottom: 12px;">
            <label class="desk-label">Upload File (PDF, DOCX, PPTX, TXT, Images - Max 15MB)</label>
            <input type="file" id="mat-file-input" class="desk-input" accept=".pdf,.docx,.pptx,.txt,image/*">
          </div>

          <button type="submit" class="desk-btn desk-btn-primary">
            ${renderIcon('sparkles', 14)} Add & Auto-Sort
          </button>
        </form>

        <!-- Materials List -->
        <div id="materials-cards-list" style="display: flex; flex-direction: column; gap: 12px;">
          ${mats.map(mat => renderMaterialItemCard(mat)).join('')}
        </div>
      </div>
    `,
    footer: `
      <button class="desk-btn desk-btn-primary" data-close-modal>
        ${renderIcon('check', 16)} Done
      </button>
    `,
    onMount: (bodyEl) => {
      const typeSelect = bodyEl.querySelector('#mat-new-type');
      const contentBox = bodyEl.querySelector('#mat-content-container');
      const fileBox = bodyEl.querySelector('#mat-file-upload-container');
      const toggleAddBtn = bodyEl.querySelector('#btn-toggle-add-mat');
      const addForm = bodyEl.querySelector('#new-material-form');

      toggleAddBtn?.addEventListener('click', () => {
        addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
      });

      typeSelect?.addEventListener('change', () => {
        if (typeSelect.value === 'document') {
          fileBox.style.display = 'block';
          contentBox.style.display = 'none';
        } else {
          fileBox.style.display = 'none';
          contentBox.style.display = 'block';
        }
      });

      // Submit new material with Gemini AI Auto-Sort
      addForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = bodyEl.querySelector('#mat-new-title').value.trim();
        const type = bodyEl.querySelector('#mat-new-type').value;
        let subject = bodyEl.querySelector('#mat-new-subject').value.trim();
        const tags = bodyEl.querySelector('#mat-new-tags').value.split(',').map(t => t.trim()).filter(Boolean);
        const content = bodyEl.querySelector('#mat-new-content').value;
        const fileInput = bodyEl.querySelector('#mat-file-input');

        let fileSize = null;
        let fileUrl = null;

        if (type === 'document' && fileInput.files[0]) {
          const file = fileInput.files[0];
          fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
          fileUrl = URL.createObjectURL(file);
        }

        // Auto-sort with Gemini if subject left blank or explicitly requested
        if (!subject) {
          const aiResult = await suggestSubjectForMaterial({ title, tags, type, content });
          subject = aiResult.subject;
          notifier.show({
            title: 'AI Auto-Sorted!',
            body: `Sorted "${title}" into ${subject}`,
            icon: '✨'
          });
        }

        const newMat = {
          id: `mat-${Date.now()}`,
          title,
          type,
          subject,
          tags,
          content,
          fileSize,
          fileUrl,
          dateAdded: Date.now()
        };

        store.setState(s => {
          // Check if subject folder exists
          const folderExists = s.folders.some(f => f.name.toLowerCase() === subject.toLowerCase());
          const nextFolders = folderExists ? s.folders : [...s.folders, { id: `f-${Date.now()}`, name: subject, icon: 'book-open' }];

          return {
            ...s,
            folders: nextFolders,
            materials: [newMat, ...s.materials]
          };
        }, 'material_created');

        deskAudio.playClick();
        window.location.hash = '';
        setTimeout(() => window.location.hash = '#materials', 50);
      });

      // Batch Sort Button
      bodyEl.querySelector('#btn-batch-ai-sort')?.addEventListener('click', async () => {
        const state = store.getState();
        notifier.show({
          title: 'Organizing Hall of Materials...',
          body: 'Gemini is evaluating titles and contents for all materials.',
          icon: '🤖'
        });

        for (const mat of state.materials) {
          const suggestion = await suggestSubjectForMaterial(mat);
          mat.subject = suggestion.subject;
        }

        store.setState(s => ({ ...s }), 'materials_batch_sorted');
        deskAudio.playCelebration();
        window.location.hash = '';
        setTimeout(() => window.location.hash = '#materials', 50);
      });

      // Search & Filter
      const searchInput = bodyEl.querySelector('#mat-search-input');
      const filterType = bodyEl.querySelector('#mat-filter-type');
      const cardsList = bodyEl.querySelector('#materials-cards-list');

      const applyFilters = () => {
        const query = searchInput.value.toLowerCase();
        const type = filterType.value;
        const state = store.getState();

        const filtered = state.materials.filter(m => {
          const matchesQuery = m.title.toLowerCase().includes(query) ||
            m.subject.toLowerCase().includes(query) ||
            m.tags.some(t => t.toLowerCase().includes(query)) ||
            (m.content && m.content.toLowerCase().includes(query));
          const matchesType = type === 'all' || m.type === type;
          return matchesQuery && matchesType;
        });

        cardsList.innerHTML = filtered.map(mat => renderMaterialItemCard(mat)).join('');
        bindMaterialItemEvents(bodyEl);
      };

      searchInput?.addEventListener('input', applyFilters);
      filterType?.addEventListener('change', applyFilters);
      bindMaterialItemEvents(bodyEl);
    }
  };
}

function renderMaterialItemCard(mat) {
  const typeIcons = {
    note: renderIcon('file-text', 16),
    document: renderIcon('book-open', 16),
    link: renderIcon('external-link', 16)
  };

  return `
    <div class="material-item-card" data-mat-id="${mat.id}" style="background: #FFFFFF; border: 1px solid var(--ink-border); border-radius: var(--radius-md); padding: 14px; box-shadow: var(--shadow-paper);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="color: var(--primary-color);">${typeIcons[mat.type] || typeIcons.note}</span>
            <h5 style="font-size: 1.05rem; font-weight: 700; margin: 0;">${escapeHTML(mat.title)}</h5>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
            <span class="desk-tag" style="background: var(--paper-yellow);">${escapeHTML(mat.subject)}</span>
            ${mat.tags.map(t => `<span class="desk-tag" style="font-size: 0.7rem;">#${escapeHTML(t)}</span>`).join('')}
            ${mat.fileSize ? `<span style="font-size: 0.74rem; color: var(--ink-muted);">${mat.fileSize}</span>` : ''}
          </div>
          ${mat.content ? `
            <div style="font-size: 0.85rem; color: var(--ink-secondary); background: rgba(0,0,0,0.02); padding: 8px 10px; border-radius: var(--radius-sm); max-height: 80px; overflow: hidden; text-overflow: ellipsis; white-space: pre-line;">
              ${escapeHTML(mat.content.slice(0, 200))}
            </div>
          ` : ''}
        </div>
        <div style="display: flex; gap: 6px; margin-left: 12px;">
          ${mat.fileUrl ? `
            <a href="${mat.fileUrl}" download="${escapeHTML(mat.title)}" class="desk-btn desk-btn-sm" title="Download">
              ${renderIcon('download', 14)}
            </a>
          ` : ''}
          <button type="button" class="desk-btn desk-btn-sm desk-btn-danger" data-delete-mat="${mat.id}" title="Delete material">
            ${renderIcon('trash-2', 14)}
          </button>
        </div>
      </div>
    </div>
  `;
}

function bindMaterialItemEvents(bodyEl) {
  bodyEl.querySelectorAll('[data-delete-mat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deleteMat;
      if (confirm('Delete this material from your study desk?')) {
        deskAudio.playClick();
        store.setState(s => ({
          ...s,
          materials: s.materials.filter(m => m.id !== id)
        }), 'material_deleted');
        window.location.hash = '';
        setTimeout(() => window.location.hash = '#materials', 50);
      }
    });
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
