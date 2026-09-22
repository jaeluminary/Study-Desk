/**
 * STUDY DESK - SPOTIFY & MUSIC MODULE
 * Client-Side Spotify Web API OAuth (PKCE Flow) & Real-time Player Controller.
 */

import { store } from '../core/store.js';
import { deskAudio } from '../core/audio.js';
import { createPushpinSVG, createArtworkPlaceholder, renderIcon } from '../components/decorations.js';
import { notifier } from '../components/notification.js';

let pollTimerId = null;

export function initMusicPlayer() {
  // Check if returning from Spotify OAuth callback with code
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    handleSpotifyCallback(code);
  }

  startMusicPolling();
}

function startMusicPolling() {
  if (pollTimerId) clearInterval(pollTimerId);
  pollTimerId = setInterval(pollNowPlaying, 5000);
}

async function pollNowPlaying() {
  const state = store.getState();
  if (!state.music.connected) {
    // Progress demo simulation if playing
    if (state.music.isPlaying) {
      store.setState(s => {
        let nextProgress = s.music.progressMs + 5000;
        if (nextProgress > s.music.durationMs) nextProgress = 0;
        return {
          ...s,
          music: { ...s.music, progressMs: nextProgress }
        };
      }, 'music_tick');
    }
    return;
  }

  const token = localStorage.getItem('spotify_access_token');
  if (!token) return;

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 204 || res.status > 400) {
      // Nothing playing or token expired
      if (res.status === 401) {
        refreshSpotifyToken();
      }
      return;
    }

    const data = await res.json();
    if (data && data.item) {
      store.setState(s => ({
        ...s,
        music: {
          ...s.music,
          connected: true,
          isPlaying: data.is_playing,
          trackTitle: data.item.name,
          artistName: data.item.artists.map(a => a.name).join(', '),
          albumArt: data.item.album.images[0]?.url || null,
          albumName: data.item.album.name,
          progressMs: data.progress_ms,
          durationMs: data.item.duration_ms,
          lastPolled: Date.now()
        }
      }), 'music_update');
    }
  } catch (err) {
    console.warn('Spotify poll error:', err);
  }
}

/**
 * Spotify OAuth PKCE Flow Initializer
 */
export async function connectSpotify(clientId) {
  if (!clientId) {
    // If no client ID provided, enable cozy demo preview mode
    store.setState(s => ({
      ...s,
      music: {
        ...s.music,
        connected: false,
        trackTitle: 'Lofi Study Coffee Beans (Demo Mode)',
        artistName: 'Cozy Beats Collective',
        isPlaying: true
      }
    }), 'music_demo');
    notifier.show({
      title: 'Demo Music Mode Active',
      body: 'To connect your real Spotify account, enter your Spotify Client ID in Settings.',
      icon: '🎵'
    });
    return;
  }

  // Generate PKCE code verifier & challenge
  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem('spotify_code_verifier', verifier);
  localStorage.setItem('spotify_client_id', clientId);

  const redirectUri = window.location.origin + window.location.pathname;
  const scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';

  const authUrl = `https://accounts.spotify.com/authorize?` + new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope
  });

  window.location.href = authUrl;
}

async function handleSpotifyCallback(code) {
  const verifier = localStorage.getItem('spotify_code_verifier');
  const clientId = localStorage.getItem('spotify_client_id');
  const redirectUri = window.location.origin + window.location.pathname;

  if (!verifier || !clientId) return;

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('spotify_access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);

      store.setState(s => ({
        ...s,
        music: { ...s.music, connected: true }
      }), 'spotify_connected');

      notifier.show({
        title: 'Spotify Connected!',
        body: 'Your live music is now synced with your Study Desk.',
        icon: '🎧'
      });

      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
      pollNowPlaying();
    }
  } catch (err) {
    console.error('Spotify token exchange failed:', err);
  }
}

async function refreshSpotifyToken() {
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  const clientId = localStorage.getItem('spotify_client_id');
  if (!refreshToken || !clientId) return;

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('spotify_access_token', data.access_token);
    }
  } catch (err) {
    console.warn('Could not refresh Spotify token:', err);
  }
}

export async function togglePlayPause() {
  deskAudio.playClick();
  const state = store.getState();
  
  if (!state.music.connected) {
    // Local demo toggle
    store.setState(s => ({
      ...s,
      music: { ...s.music, isPlaying: !s.music.isPlaying }
    }), 'music_toggle');
    return;
  }

  const token = localStorage.getItem('spotify_access_token');
  if (!token) return;

  const endpoint = state.music.isPlaying 
    ? 'https://api.spotify.com/v1/me/player/pause'
    : 'https://api.spotify.com/v1/me/player/play';

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 403) {
      notifier.show({
        title: 'Spotify Free Account',
        body: 'Playback controls require Spotify Premium. Now Playing remains active!',
        icon: 'ℹ️'
      });
    } else {
      store.setState(s => ({
        ...s,
        music: { ...s.music, isPlaying: !s.music.isPlaying }
      }), 'music_toggle');
    }
  } catch (e) {
    console.warn('Playback control error:', e);
  }
}

export function renderMusicPreview() {
  const state = store.getState();
  const music = state.music;
  const progressPct = Math.min(100, Math.round((music.progressMs / (music.durationMs || 1)) * 100));

  return `
    <div class="paper-card music-card paper-blue" id="music-paper">
      ${createPushpinSVG('var(--pin-color-4)', 'pin-right')}

      <div class="paper-header">
        <h3 class="paper-title" data-open-route="music">
          ${renderIcon('music', 18)} Study Beats
        </h3>
        <button class="desk-btn desk-btn-sm" data-open-route="music" title="Spotify Settings">
          ${renderIcon('maximize-2', 14)}
        </button>
      </div>

      <div class="music-player-layout">
        <div class="music-album-art">
          ${music.albumArt ? `
            <img src="${escapeHTML(music.albumArt)}" class="music-album-img" alt="Album Cover">
          ` : `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          `}
        </div>

        <div class="music-info-meta">
          <div class="music-track-title">${escapeHTML(music.trackTitle)}</div>
          <div class="music-artist-name">${escapeHTML(music.artistName)}</div>
          <div class="desk-progress-track" style="height: 6px;">
            <div class="desk-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
        <span style="font-size: 0.72rem; color: var(--ink-muted);">
          ${music.connected ? '🟢 Spotify Synced' : '⚪ Demo Study Track'}
        </span>
        <div style="display: flex; gap: 8px;">
          <button class="desk-btn desk-btn-sm desk-btn-icon" id="btn-music-playpause" title="${music.isPlaying ? 'Pause' : 'Play'}">
            ${music.isPlaying ? renderIcon('pause', 14) : renderIcon('play', 14)}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderMusicDetail() {
  const state = store.getState();
  const music = state.music;

  return {
    title: `${renderIcon('music', 22)} Spotify & Music Settings`,
    body: `
      <div style="margin-bottom: 20px;">
        <div style="padding: 16px; background: #FFFFFF; border: 1px solid var(--ink-border); border-radius: var(--radius-md); box-shadow: var(--shadow-paper); margin-bottom: 16px;">
          <div style="display: flex; gap: 16px; align-items: center;">
            <div style="width: 80px; height: 80px; background: var(--paper-kraft); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${music.albumArt ? `<img src="${escapeHTML(music.albumArt)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 2rem;">☕</span>`}
            </div>
            <div>
              <h4 style="font-size: 1.15rem; font-weight: bold; margin: 0 0 4px 0;">${escapeHTML(music.trackTitle)}</h4>
              <p style="font-size: 0.9rem; color: var(--ink-secondary); margin: 0 0 8px 0;">${escapeHTML(music.artistName)}</p>
              <span class="desk-tag">${music.connected ? 'Spotify Connected' : 'Demo Mode'}</span>
            </div>
          </div>
        </div>

        <h4 style="font-family: var(--font-hand); font-size: 1.4rem; margin-bottom: 8px;">Connect Spotify Account</h4>
        <p style="font-size: 0.88rem; color: var(--ink-secondary); margin-bottom: 14px;">
          Connect your Spotify account using Spotify PKCE flow to display your live track progress and control playback while studying.
        </p>

        <form id="spotify-connect-form">
          <div class="desk-field-group">
            <label class="desk-label" for="spotify-client-id-input">Spotify App Client ID (Optional for Real Auth)</label>
            <input type="text" id="spotify-client-id-input" class="desk-input" placeholder="e.g. 7a8b9c..." value="${localStorage.getItem('spotify_client_id') || ''}">
            <span style="font-size: 0.74rem; color: var(--ink-muted); margin-top: 4px; display: block;">
              Leave blank to use cozy built-in demo track mode.
            </span>
          </div>
          <button type="submit" class="desk-btn desk-btn-primary">
            ${renderIcon('external-link', 14)} Connect Spotify / Save
          </button>
        </form>
      </div>
    `,
    footer: `
      <button class="desk-btn desk-btn-primary" data-close-modal>
        ${renderIcon('check', 16)} Close
      </button>
    `,
    onMount: (bodyEl) => {
      const form = bodyEl.querySelector('#spotify-connect-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const cid = bodyEl.querySelector('#spotify-client-id-input').value.trim();
        connectSpotify(cid);
      });
    }
  };
}

function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
