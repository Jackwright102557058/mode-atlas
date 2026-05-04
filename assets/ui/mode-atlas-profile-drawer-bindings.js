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

  function installStyles(){
    if (document.getElementById('ma-shared-drawer-style')) return;
    const style = document.createElement('style');
    style.id = 'ma-shared-drawer-style';
    style.textContent = `
      .ma-drawer-backdrop{position:fixed;inset:0;z-index:80;display:none;background:rgba(2,6,23,.56);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
      .ma-drawer-backdrop.open{display:block;}
      .ma-shared-profile-drawer,.ma-shared-settings-drawer{position:fixed;top:18px;right:18px;z-index:90;width:min(420px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow-y:auto;padding:18px;border-radius:28px;background:radial-gradient(circle at top right,rgba(125,181,255,.18),transparent 34%),linear-gradient(180deg,rgba(22,25,34,.98),rgba(9,11,16,.98));border:1px solid rgba(255,255,255,.10);box-shadow:0 32px 90px rgba(0,0,0,.55);color:var(--text,#f3f3f3);box-sizing:border-box;transform:translateX(calc(100% + 44px));transition:transform .24s ease;}
      .ma-shared-profile-drawer.open,.ma-shared-settings-drawer.open{transform:translateX(0);}
       .ma-drawer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}
      .ma-menu-kicker{font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#9aa3b8);}
      .ma-drawer-title{font-weight:950;font-size:1.8rem;line-height:1.05;letter-spacing:-.04em;color:#f8fbff;}
      .ma-drawer-close{appearance:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:auto!important;min-width:74px!important;height:42px!important;min-height:42px!important;padding:0 16px!important;border:1px solid rgba(148,163,184,.24)!important;background:rgba(15,23,42,.62)!important;color:#eaf2ff!important;border-radius:999px!important;font:inherit!important;font-size:14px!important;font-weight:850!important;line-height:1!important;white-space:nowrap!important;cursor:pointer!important;}
      .ma-drawer-close:hover{background:rgba(30,41,59,.82)!important;border-color:rgba(125,181,255,.36)!important;}
      .ma-profile-card,.ma-settings-card,.ma-account-card,.ma-sync-card,.ma-branch-card,.ma-achievement-card-summary,.ma-settings-panel,.ma-save-section{margin-top:12px!important;padding:14px!important;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.085);box-shadow:inset 0 1px 0 rgba(255,255,255,.035);}
      .ma-auth-actions{margin-top:12px;display:grid;grid-template-columns:1fr;gap:10px;}
      .ma-shared-profile-drawer .ma-menu-action,.ma-shared-settings-drawer .ma-menu-action,.ma-shared-settings-drawer .ma-settings-choice{min-height:46px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;text-align:center;font-weight:850;line-height:1.15;text-decoration:none;background:rgba(15,23,42,.66)!important;border:1px solid rgba(148,163,184,.18)!important;color:#eef4ff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 10px 24px rgba(0,0,0,.16)!important;cursor:pointer;}
      .ma-shared-profile-drawer .ma-menu-action:hover,.ma-shared-settings-drawer .ma-menu-action:hover,.ma-shared-settings-drawer .ma-settings-choice:hover{background:rgba(30,41,59,.82)!important;border-color:rgba(125,181,255,.34)!important;transform:translateY(-1px);}
      .ma-shared-profile-drawer .ma-menu-action.ma-primary,.ma-shared-settings-drawer .ma-menu-action.ma-primary,.ma-shared-settings-drawer .ma-settings-choice.ma-primary{background:rgba(45,72,118,.76)!important;border-color:rgba(125,181,255,.42)!important;}
      .ma-shared-settings-drawer .ma-danger{border-color:rgba(255,107,107,.38)!important;color:#ffd6d6!important;background:rgba(127,29,29,.28)!important;}
      .ma-account-user{display:flex;align-items:center;gap:12px;}
      .ma-account-avatar{width:46px;height:46px;border-radius:999px;object-fit:cover;background:rgba(125,181,255,.16);border:1px solid rgba(125,181,255,.24);}
      .ma-account-name{font-weight:950;color:#f8fbff;}
      .ma-account-email,.ma-sync-detail{color:var(--muted,#9aa3b8);font-size:13px;line-height:1.45;}
      .section-kicker,.ma-settings-title{font-size:12px;font-weight:950;letter-spacing:.16em;text-transform:uppercase;color:#aeb9d0;margin-bottom:10px;}
      .ma-sync-status-line{display:flex;align-items:center;gap:10px;margin-top:6px;}
      .ma-sync-dot{width:10px;height:10px;border-radius:999px;background:#7db5ff;box-shadow:0 0 0 4px rgba(125,181,255,.12);flex:0 0 auto;}
      .ma-sync-dot.ok,.ma-sync-dot.cloud{background:#75e3a8;box-shadow:0 0 0 4px rgba(117,227,168,.13);}
      .ma-sync-dot.warning,.ma-sync-dot.offline{background:#ffca75;box-shadow:0 0 0 4px rgba(255,202,117,.15);}
      .ma-sync-meta{margin-top:8px;font-size:12px;color:var(--muted,#9aa3b8);}
      .ma-branch-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px;}
      .ma-branch-button{justify-content:center;text-align:center;text-decoration:none;}
      .ma-branch-button.ma-placeholder{opacity:.56;cursor:not-allowed;}
      .ma-achievement-summary{display:flex;align-items:baseline;gap:8px;margin:8px 0 12px;}
      .ma-achievement-summary strong{font-size:30px;line-height:1;}
      .ma-achievement-summary span{color:var(--muted,#9aa3b8);font-size:13px;font-weight:800;}
      .ma-shared-settings-drawer .ma-settings-grid{display:grid;gap:10px;margin-top:10px;}
      .ma-shared-settings-drawer .ma-settings-grid.two{grid-template-columns:repeat(2,minmax(0,1fr));}
      .ma-shared-settings-drawer .ma-settings-grid.three{grid-template-columns:repeat(3,minmax(0,1fr));}
      .ma-shared-settings-drawer .ma-settings-grid.four{grid-template-columns:repeat(2,minmax(0,1fr));}
      .ma-shared-settings-drawer .ma-display-option.active,.ma-shared-settings-drawer [data-ma-theme-choice].active,.ma-shared-settings-drawer [data-ma-theme-choice][data-active="true"],.ma-shared-settings-drawer .ma-sound-toggle.active,.ma-shared-settings-drawer .ma-sound-toggle[data-active="true"]{border-color:rgba(125,181,255,.68)!important;background:linear-gradient(180deg,rgba(63,94,143,.72),rgba(30,48,80,.86))!important;color:#f8fbff!important;box-shadow:0 0 0 3px rgba(125,181,255,.18),inset 0 1px 0 rgba(255,255,255,.12)!important;}
      .ma-settings-trigger{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:52px!important;min-width:52px!important;height:52px!important;min-height:52px!important;padding:0!important;border-radius:999px!important;gap:0!important;}
      .ma-settings-trigger .ma-settings-icon{font-size:2.1rem;line-height:1;display:block;}
      .ma-settings-trigger .ma-settings-label{display:none!important;}
      @media(max-width:1180px){body[data-effective-display-mode="tablet"] .ma-shared-profile-drawer,body[data-effective-display-mode="tablet"] .ma-shared-settings-drawer{width:min(560px,calc(100vw - 32px));max-height:calc(100dvh - 32px);}}
      @media(max-width:560px){.ma-shared-profile-drawer,.ma-shared-settings-drawer{top:12px;right:12px;left:12px;width:auto;max-height:calc(100dvh - 24px);border-radius:22px;}.ma-branch-grid,.ma-shared-settings-drawer .ma-settings-grid.two,.ma-shared-settings-drawer .ma-settings-grid.three,.ma-shared-settings-drawer .ma-settings-grid.four{grid-template-columns:1fr;}}
      body[data-effective-display-mode="phone"] .ma-shared-profile-drawer,body[data-effective-display-mode="phone"] .ma-shared-settings-drawer{top:10px;right:10px;left:10px;width:auto;max-height:calc(100dvh - 20px);border-radius:22px;padding:14px;}
      body[data-effective-display-mode="phone"] .ma-branch-grid,body[data-effective-display-mode="phone"] .ma-shared-settings-drawer .ma-settings-grid.two,body[data-effective-display-mode="phone"] .ma-shared-settings-drawer .ma-settings-grid.three,body[data-effective-display-mode="phone"] .ma-shared-settings-drawer .ma-settings-grid.four{grid-template-columns:1fr;}
    `;
    document.head.appendChild(style);
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
      button.className = profileButton.className || 'profile-trigger';
      button.classList.add('ma-settings-trigger');
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
    installStyles();
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAll(); });
  window.addEventListener('kanaCloudSyncStatusChanged', () => { bindCloudUi(); updateSyncStatus(); });
  window.addEventListener('online', updateSyncStatus);
  window.addEventListener('offline', updateSyncStatus);
})();
