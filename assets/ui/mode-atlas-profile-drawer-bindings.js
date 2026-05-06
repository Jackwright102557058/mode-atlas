(function ModeAtlasSharedDrawers(){
  'use strict';
  if (window.__modeAtlasSharedDrawersInstalled) return;
  window.__modeAtlasSharedDrawersInstalled = true;

  const scriptEl = document.currentScript || Array.from(document.scripts).find((script) => /mode-atlas-profile-drawer-bindings\.js(?:\?|$)/.test(script.src));
  const appRoot = scriptEl && scriptEl.src ? new URL('../../', scriptEl.src) : new URL('./', location.href);
  const href = (path) => new URL(path, appRoot).href;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function countUnlockedAchievements(){
    const set = readJson('modeAtlasSeenAchievementUnlocks', []);
    return Array.isArray(set) ? set.length : 0;
  }

  function formatTime(ts){
    const n = Number(ts || 0);
    if (!n) return 'Never synced';
    const date = new Date(n);
    if (Number.isNaN(date.getTime())) return 'Never synced';
    const diff = Math.max(0, Date.now() - n);
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.round(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.round(diff / 3600000) + 'h ago';
    return date.toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
  }

  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  }

  function removeStaticDrawers(){
    document.querySelectorAll('#profileDrawer,#profileBackdrop,#drawerBackdrop,#studyProfileOverlay,#settingsDrawer,#settingsBackdrop').forEach((node) => node.remove());
  }

  function setDrawerOpen(name, open){
    const drawerId = name === 'settings' ? 'settingsDrawer' : 'profileDrawer';
    const backdropId = name === 'settings' ? 'settingsBackdrop' : 'profileBackdrop';
    const drawer = document.getElementById(drawerId);
    const backdrop = document.getElementById(backdropId);
    if (drawer) {
      drawer.classList.toggle('open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (backdrop) backdrop.classList.toggle('open', open);
    document.body.classList.toggle(name === 'settings' ? 'settings-open' : 'profile-open', open);
    if (open) setTimeout(() => document.getElementById(name === 'settings' ? 'settingsCloseBtn' : 'profileCloseBtn')?.focus(), 0);
  }

  function openProfile(){ setDrawerOpen('settings', false); setDrawerOpen('profile', true); }
  function closeProfile(){ setDrawerOpen('profile', false); }
  function openSettings(){ setDrawerOpen('profile', false); setDrawerOpen('settings', true); }
  function closeSettings(){ setDrawerOpen('settings', false); }
  function closeAll(){ closeProfile(); closeSettings(); }

  function profileTriggerButtons(){
    return Array.from(document.querySelectorAll('#profileOpenBtn,#studyProfileBtn,.profile-trigger,[data-profile-open],#studyProfileOpen'))
      .filter((button) => button && !button.matches('[data-settings-open],.ma-settings-trigger'));
  }

  function ensureSettingsButtons(){
    profileTriggerButtons().forEach((profileButton) => {
      if (!profileButton || profileButton.dataset.maSettingsNeighbor === '1') return;
      const existing = profileButton.parentElement?.querySelector('[data-settings-open]');
      if (existing) {
        profileButton.dataset.maSettingsNeighbor = '1';
        return;
      }
      const button = document.createElement('button');
      button.type = 'button';
      const isStudyNav = profileButton.classList.contains('study-nav-btn') || !!profileButton.closest('.study-nav-actions');
      const isBranchNav = !!profileButton.closest('.branch-links');
      const isTopNav = !!profileButton.closest('.nav,.topbar');
      button.className = [
        isStudyNav ? 'study-nav-btn' : '',
        isBranchNav ? 'branch-link' : '',
        isTopNav ? 'nav-link' : '',
        'ma-settings-trigger'
      ].filter(Boolean).join(' ');
      button.setAttribute('data-settings-open', '');
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', 'settingsDrawer');
      button.setAttribute('aria-label', 'Open settings');
      button.title = 'Settings';
      button.innerHTML = '<span class="ma-settings-icon" aria-hidden="true">⚙</span><span class="ma-settings-label">Settings</span>';
      profileButton.insertAdjacentElement('afterend', button);
      profileButton.dataset.maSettingsNeighbor = '1';
    });
  }

  function bindOpenClose(){
    ensureSettingsButtons();
    profileTriggerButtons().forEach((button) => {
      if (button.dataset.profileBound === 'shared') return;
      button.dataset.profileBound = 'shared';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openProfile();
      }, true);
    });
    document.querySelectorAll('[data-settings-open]').forEach((button) => {
      if (button.dataset.settingsBound === 'shared') return;
      button.dataset.settingsBound = 'shared';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openSettings();
      }, true);
    });
    document.querySelectorAll('[data-ma-drawer-close="profile"],#profileCloseBtn').forEach((button) => {
      if (button.dataset.profileCloseBound === 'shared') return;
      button.dataset.profileCloseBound = 'shared';
      button.addEventListener('click', (event) => { event.preventDefault(); closeProfile(); });
    });
    document.querySelectorAll('[data-ma-drawer-close="settings"],#settingsCloseBtn').forEach((button) => {
      if (button.dataset.settingsCloseBound === 'shared') return;
      button.dataset.settingsCloseBound = 'shared';
      button.addEventListener('click', (event) => { event.preventDefault(); closeSettings(); });
    });
  }

  function bindSettings(){
    const display = window.ModeAtlasDisplay;
    const normalize = (value) => display?.normalizeMode ? display.normalizeMode(value) : String(value || 'auto').toLowerCase();
    const currentMode = () => display?.getMode ? display.getMode() : normalize(localStorage.getItem('modeAtlasDisplayMode') || 'auto');
    const apply = () => {
      if (display?.applyMode) display.applyMode();
      else {
        const mode = currentMode();
        document.body.dataset.displayMode = mode;
        document.querySelectorAll('.ma-display-option').forEach((button) => button.classList.toggle('active', normalize(button.dataset.display) === mode));
      }
    };
    document.querySelectorAll('.ma-display-option').forEach((button) => {
      if (button.dataset.displayBound === 'shared') return;
      button.dataset.displayBound = 'shared';
      button.addEventListener('click', () => {
        const nextMode = normalize(button.dataset.display || 'auto');
        if (display?.setMode) display.setMode(nextMode);
        else {
          localStorage.setItem('modeAtlasDisplayMode', nextMode);
          window.dispatchEvent(new CustomEvent('modeAtlasDisplayModeChanged', { detail: { mode: nextMode } }));
        }
        apply();
      });
    });
    apply();
  }

  function bindCloudUi(){
    const sync = window.KanaCloudSync;
    if (!sync?.bindUi) return false;
    try {
      sync.bindUi({
        signInBtn: document.getElementById('profileSignInBtn'),
        signOutBtn: document.getElementById('profileSignOutBtn'),
        statusEl: null,
        nameEl: document.getElementById('profileName'),
        emailEl: document.getElementById('profileEmail'),
        photoEl: document.getElementById('profileAvatar')
      });
      return true;
    } catch (error) {
      console.warn('Profile cloud controls could not bind.', error);
      return false;
    }
  }

  function updateProfileDot(){
    const user = window.KanaCloudSync?.getUser?.();
    document.querySelectorAll('#topProfileDot,#studyTopProfileDot,#profileDot').forEach((dot) => {
      if (!dot) return;
      if (user?.photoURL) dot.innerHTML = '<img src="' + escapeHtml(user.photoURL) + '" alt="" />';
      else {
        const label = (user?.displayName || user?.email || 'M').trim();
        dot.textContent = (label[0] || 'M').toUpperCase();
      }
    });
  }

  function updateSyncStatus(){
    const status = window.KanaCloudSync?.getSyncStatus?.() || { state:'local', tone:'neutral', text:'Progress saves on this device · sign in to sync', lastSync: Number(localStorage.getItem('modeAtlasLastCloudSyncAt') || 0), user: null };
    const tone = status.tone || status.state || 'neutral';
    const summary = document.getElementById('profileSyncSummary');
    const detail = document.getElementById('profileSyncDetail');
    const meta = document.getElementById('profileSyncMeta');
    const dot = document.getElementById('profileSyncDot');
    if (summary) summary.textContent = status.text || 'Progress saves on this device';
    if (detail) detail.textContent = status.user ? 'Signed in with Google. Cloud sync updates automatically when progress changes.' : 'Not signed in. Your progress is saved locally on this device.';
    if (meta) meta.textContent = 'Last cloud sync: ' + formatTime(status.lastSync || localStorage.getItem('modeAtlasLastCloudSyncAt'));
    if (dot) dot.className = 'ma-sync-dot ' + tone;
    updateProfileDot();
    const ach = document.getElementById('profileAchievementCount');
    if (ach) ach.textContent = String(countUnlockedAchievements());
  }

  function install(){
    removeStaticDrawers();
    const profileMarkup = window.ModeAtlasProfileMenu?.markup?.({ href });
    const settingsMarkup = window.ModeAtlasSettingsMenu?.markup?.({ href });
    if (!profileMarkup || !settingsMarkup) {
      console.warn('Mode Atlas profile/settings menu markup was not available.');
      return;
    }
    document.body.insertAdjacentHTML('afterbegin', profileMarkup + settingsMarkup);
    bindOpenClose();
    bindSettings();
    bindCloudUi();
    updateSyncStatus();
    try { window.ModeAtlasSounds?.refresh?.(); } catch {}
    window.ModeAtlasProfile = Object.assign(window.ModeAtlasProfile || {}, { open: openProfile, close: closeProfile, refresh: updateSyncStatus });
    window.ModeAtlasSettings = Object.assign(window.ModeAtlasSettings || {}, { open: openSettings, close: closeSettings });
    window.ModeAtlasKanaProfile = window.ModeAtlasProfile;
    window.ModeAtlasTestProfile = window.ModeAtlasProfile;
    window.ModeAtlasWordProfile = window.ModeAtlasProfile;
    try { window.dispatchEvent(new CustomEvent('modeAtlasProfileMenuReady')); } catch {}
    try { window.dispatchEvent(new CustomEvent('modeAtlasSettingsMenuReady')); } catch {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAll(); });
  window.addEventListener('kanaCloudSyncStatusChanged', () => { bindCloudUi(); updateSyncStatus(); });
  window.addEventListener('online', updateSyncStatus);
  window.addEventListener('offline', updateSyncStatus);
})();
