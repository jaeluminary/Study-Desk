/**
 * STUDY DESK - CODE-DRAWN VISUAL ENGINE
 * Generates pushpins, washi tape, rubber stamps, postmarks, doodles, and icons.
 * Strict compliance with ZERO AI-generated images rule.
 */

/**
 * Generates a realistic pushpin SVG
 * @param {string} color - Pin dome color (defaults to theme accent)
 * @param {string} className - Extra CSS classes (e.g. 'pin-left', 'pin-right')
 */
export function createPushpinSVG(color = 'var(--pin-color-1)', className = '') {
  return `
    <div class="pushpin ${className}" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <!-- Pin Needle with metallic gradient -->
        <defs>
          <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#737373"/>
            <stop offset="50%" stop-color="#E5E5E5"/>
            <stop offset="100%" stop-color="#404040"/>
          </linearGradient>
          <radialGradient id="domeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6"/>
            <stop offset="40%" stop-color="${color}" stop-opacity="1"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.4"/>
          </radialGradient>
        </defs>
        <!-- Shadow -->
        <ellipse cx="16" cy="30" rx="4" ry="2" fill="rgba(30, 20, 10, 0.45)"/>
        <!-- Needle -->
        <path d="M15 16 L17 16 L16.5 30 L15.5 30 Z" fill="url(#needleGrad)"/>
        <!-- Dome base rim -->
        <ellipse cx="16" cy="16" rx="9" ry="3.5" fill="rgba(0,0,0,0.2)"/>
        <ellipse cx="16" cy="15" rx="8" ry="3" fill="${color}" filter="brightness(0.85)"/>
        <!-- Head Dome -->
        <circle cx="16" cy="12" r="7.5" fill="${color}"/>
        <circle cx="16" cy="12" r="7.5" fill="url(#domeGrad)"/>
        <!-- Specular Highlight -->
        <circle cx="14" cy="9.5" r="2.2" fill="#FFFFFF" opacity="0.75"/>
      </svg>
    </div>
  `;
}

/**
 * Generates a semi-translucent washi tape strip
 */
export function createWashiTape(colorVar = 'var(--tape-color-1)', rotation = '-2deg', className = '') {
  return `<div class="washi-tape ${className}" style="--tape-color: ${colorVar}; --tape-rot: ${rotation};" aria-hidden="true"></div>`;
}

/**
 * Generates an authentic code-drawn postal postmark with cancellation lines
 */
export function createPostmarkHTML(station = 'STUDY DESK POST', dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })) {
  return `
    <div class="rubber-stamp circular" aria-hidden="true">
      <div style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase;">${station}</div>
      <div style="font-size: 0.72rem; font-weight: 700; margin: 2px 0;">★ ${dateStr} ★</div>
      <div style="font-size: 0.55rem; letter-spacing: 0.05em;">VERIFIED FOCUS</div>
    </div>
  `;
}

/**
 * Generates a rectangular rubber stamp
 */
export function createRubberStamp(text = 'COMPLETED', rotation = '-8deg', color = 'var(--stamp-ink)') {
  return `
    <div class="rubber-stamp" style="--stamp-rot: ${rotation}; --stamp-ink: ${color};" aria-hidden="true">
      ${text}
    </div>
  `;
}

/**
 * Generates a customizable artwork placeholder slot (Hard Rule compliant)
 */
export function createArtworkPlaceholder(label = 'Custom Illustration Slot', sub = 'Click to customize or drop artwork', slotId = 'art-slot-1') {
  return `
    <div class="art-placeholder-slot" id="${slotId}" role="button" tabindex="0" title="Placeholder for student artwork">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 4px; opacity: 0.75;">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
      <div class="art-placeholder-label">${label}</div>
      <div class="art-placeholder-sub">${sub}</div>
    </div>
  `;
}

/**
 * Inline hand-drawn cozy SVG doodles for empty states and decorative accents
 */
export const doodles = {
  teaMug: `
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 20 H44 V46 C44 52 38 56 30 56 C22 56 16 52 14 46 Z" fill="var(--paper-yellow)"/>
      <path d="M44 26 C50 26 54 30 54 36 C54 42 50 46 44 46" />
      <path d="M22 14 C22 10 24 8 22 4" stroke-dasharray="2 3"/>
      <path d="M30 14 C30 10 32 8 30 4" stroke-dasharray="2 3"/>
      <path d="M38 14 C38 10 40 8 38 4" stroke-dasharray="2 3"/>
    </svg>
  `,
  openBook: `
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 48 C16 44 26 44 32 48 C38 44 48 44 56 48 V16 C48 12 38 12 32 16 C26 12 16 12 8 16 Z" fill="var(--paper-cream)"/>
      <path d="M32 16 V48" />
      <path d="M16 24 C22 22 26 22 28 23" />
      <path d="M16 32 C22 30 26 30 28 31" />
      <path d="M36 23 C38 22 42 22 48 24" />
      <path d="M36 31 C38 30 42 30 48 32" />
    </svg>
  `,
  deskLamp: `
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="32" cy="56" rx="14" ry="4" fill="var(--paper-kraft)"/>
      <path d="M32 54 L36 34 L24 22" />
      <path d="M16 26 L30 14 L36 20 L22 32 Z" fill="var(--badge-bg)"/>
      <circle cx="28" cy="23" r="3" fill="#FFFFFF"/>
    </svg>
  `,
  plantSprout: `
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 56 H42 L40 38 H24 Z" fill="var(--paper-pink)"/>
      <path d="M32 38 V22" />
      <path d="M32 28 C26 22 24 16 24 16 C24 16 30 16 36 22" fill="var(--accent-2)" fill-opacity="0.3"/>
      <path d="M32 22 C38 16 40 10 40 10 C40 10 34 10 28 16" fill="var(--accent-2)" fill-opacity="0.3"/>
    </svg>
  `,
  pencil: `
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M46 12 L52 18 L24 46 L14 50 L18 40 Z" fill="var(--paper-yellow)"/>
      <path d="M40 18 L46 24" />
      <path d="M14 50 L18 40 L24 46 Z" fill="var(--ink-primary)"/>
    </svg>
  `,
  trophy: `
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 14 H44 V30 C44 38 38 42 32 42 C26 42 20 38 20 30 Z" fill="var(--badge-bg)"/>
      <path d="M20 18 H12 C10 18 8 20 8 24 C8 30 14 32 20 32" />
      <path d="M44 18 H52 C54 18 56 20 56 24 C56 30 50 32 44 32" />
      <path d="M32 42 V50" />
      <path d="M22 50 H42" />
    </svg>
  `
};

/**
 * Renders an accessible inline Lucide-style SVG icon
 */
export function renderIcon(name, size = 18, strokeWidth = 2) {
  const iconPaths = {
    'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    'play': '<polygon points="5 3 19 12 5 21 5 3"/>',
    'pause': '<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>',
    'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    'check': '<polyline points="20 6 9 17 4 12"/>',
    'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'music': '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    'award': '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    'maximize-2': '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
    'skip-forward': '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
    'skip-back': '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
    'external-link': '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    'trash-2': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    'undo': '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'
  };

  const body = iconPaths[name] || iconPaths['sparkles'];
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide-${name}" aria-hidden="true">${body}</svg>`;
}
