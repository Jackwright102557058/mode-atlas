(function ModeAtlasAbout(){
  'use strict';
  if (window.__modeAtlasAboutLoaded) return;
  window.__modeAtlasAboutLoaded = true;

  const APP_VERSION = (window.ModeAtlasEnv && window.ModeAtlasEnv.appVersion) || window.ModeAtlasVersion || 'dev-local';
  const SAVE_SCHEMA_VERSION = '3';
  const BUILD_LABEL = 'Professional Polish Update';
  const BUILD_DATE = '2026-05-01';
  const DEVELOPER = 'Jack Wright';
  const SUPPORT_EMAIL = 'support@mode-atlas.com';
  const OFFICIAL_SITE = 'mode-atlas.app';
  const PAGE = (window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase();
  const whatsNewItems = [
    'Cleaner menus and shared Profile / Settings controls.',
    'Improved save import summaries and safer backup handling.',
    'More reliable update handling after new releases.',
    'Light Mode contrast and layout polish.'
  ];

  function $(sel, root = document){ return root.querySelector(sel); }
  function $all(sel, root = document){ return Array.from(root.querySelectorAll(sel)); }
  function fmtDate(ts){
    const n = Number(ts || 0);
    if (!Number.isFinite(n) || !n) return 'Never';
    const d = new Date(n);
    if (Number.isNaN(d.getTime())) return 'Never';
    return d.toLocaleString([], { hour:'numeric', minute:'2-digit', day:'numeric', month:'short', year:'numeric' });
  }
  function aboutBasePath(){
    try {
      const marker = '/assets/';
      const script = Array.from(document.scripts || []).find(s => String(s.src || '').includes('/assets/app/mode-atlas-about.js'));
      if (script && script.src) return new URL(script.src.slice(0, script.src.indexOf(marker) + 1)).pathname;
    } catch {}
    return '/';
  }
  function aboutAppUrl(path){
    const clean = String(path || '').replace(/^\/+/, '');
    try { return new URL(clean, location.origin + aboutBasePath()).pathname; } catch { return '/' + clean; }
  }
  function latestTimestamp(keys){
    let best = 0;
    keys.forEach(key => {
      const n = Number(localStorage.getItem(key) || 0);
      if (Number.isFinite(n) && n > best) best = n;
    });
    return best;
  }
  function getCloudStatus(){
    const user = window.KanaCloudSync?.getUser?.() || window.currentUser || null;
    const signedIn = !!user;
    const online = navigator.onLine !== false;
    const lastSync = latestTimestamp([
      'modeAtlasLastCloudSyncAt','modeAtlasLastSyncCheck','cloudReadingUpdatedAt','cloudWritingUpdatedAt','testModeResultsUpdatedAt','readingTestModeResultsUpdatedAt','writingTestModeResultsUpdatedAt','kanaWordBankUpdatedAt'
    ]);
    let mode = 'Local only';
    let status = 'Local saving active';
    if (signedIn && online){ mode = 'Cloud + local'; status = 'Cloud available'; }
    else if (signedIn && !online){ mode = 'Cloud account offline'; status = 'No cloud access'; }
    return { signedIn, online, mode, status, lastSync };
  }
  function getAppInfo(){
    const cloud = getCloudStatus();
    return {
      version: APP_VERSION,
      saveSchema: SAVE_SCHEMA_VERSION,
      build: BUILD_LABEL,
      buildDate: BUILD_DATE,
      page: (location.pathname.split('/').pop() || 'index.html'),
      theme: localStorage.getItem('modeAtlasThemePreference') || 'system',
      saveMode: cloud.mode,
      cloudStatus: cloud.status,
      signedIn: cloud.signedIn ? 'Yes' : 'No',
      online: cloud.online ? 'Yes' : 'No',
      lastCloudSync: fmtDate(cloud.lastSync),
      localSaveUpdated: fmtDate(latestTimestamp(['settingsUpdatedAt','resultsUpdatedAt','srsUpdatedAt','dailyUpdatedAt','profileUpdatedAt','modeAtlasLastSyncCheck','kanaWordBankUpdatedAt'])),
      installSupport: window.ModeAtlasInstall ? 'Available' : 'Not available here',
      supportEmail: SUPPORT_EMAIL,
      storage: (() => { try { localStorage.setItem('__ma_probe','1'); localStorage.removeItem('__ma_probe'); return 'Available'; } catch { return 'Blocked'; } })()
    };
  }
  function ensureWhatsNewModal(){
    let modal = $('#maWhatsNew');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'maWhatsNew';
    modal.className = 'ma-whats-new-backdrop';
    modal.innerHTML = `<div class="ma-whats-new-modal">
      <h2>What’s new</h2>
      <p>Mode Atlas has a new polish update focused on cleaner menus, safer save handling, and clearer account information.</p>
      <ul>${whatsNewItems.map(item => `<li>${item}</li>`).join('')}</ul>
      <button type="button" data-ma-whats-new-close>Done</button>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target === modal || event.target.closest('[data-ma-whats-new-close]')) {
        modal.classList.remove('open');
        markWhatsNewSeen();
      }
    });
    return modal;
  }
  function whatsNewSignature(){ return APP_VERSION + '::' + whatsNewItems.join('|'); }
  function markWhatsNewSeen(){
    try {
      localStorage.setItem('maWhatsNewSeenVersion', APP_VERSION);
      localStorage.setItem('maWhatsNewSeenSignature', whatsNewSignature());
      localStorage.setItem('maWhatsNewSeen', APP_VERSION);
    } catch {}
  }
  function shouldAutoShowWhatsNew(){
    try {
      return localStorage.getItem('maWhatsNewSeenVersion') !== APP_VERSION || localStorage.getItem('maWhatsNewSeenSignature') !== whatsNewSignature();
    } catch { return true; }
  }
  function showWhatsNew(){
    ensureWhatsNewModal().classList.add('open');
    markWhatsNewSeen();
  }
  function onboardingComplete(){
    try { return localStorage.getItem('modeAtlasOnboardingComplete') === 'true' || localStorage.getItem('modeAtlasStarterSeen') === 'true'; } catch { return false; }
  }
  function onboardingOpen(){ return !!document.querySelector('#maVisitModal.open'); }
  function scheduleWhatsNew(){
    setTimeout(() => {
      let pending = false;
      try { pending = sessionStorage.getItem('modeAtlasShowWhatsNewAfterOnboarding') === '1'; } catch {}
      if (pending) {
        try { sessionStorage.removeItem('modeAtlasShowWhatsNewAfterOnboarding'); } catch {}
        setTimeout(() => { if (!onboardingOpen()) showWhatsNew(); }, 450);
        return;
      }
      if (shouldAutoShowWhatsNew() && onboardingComplete() && !onboardingOpen() && ['index.html','kana.html'].includes(PAGE)) showWhatsNew();
    }, 1200);
  }

  function ensureAboutModal(){
    let backdrop = $('#maAboutBackdrop');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.id = 'maAboutBackdrop';
    backdrop.className = 'ma-about-backdrop';
    backdrop.innerHTML = `
      <section class="ma-about-modal" role="dialog" aria-modal="true" aria-labelledby="maAboutTitle">
        <div class="ma-about-hero">
          <div class="ma-about-mark">かな</div>
          <div>
            <div class="ma-about-kicker">Mode Atlas</div>
            <h2 id="maAboutTitle">About Mode Atlas</h2>
            <p>Japanese study tools for kana recognition, recall, review, and connected learning branches.</p>
          </div>
          <button type="button" class="ma-about-close" data-ma-about-close aria-label="Close About">Close</button>
        </div>
        <div class="ma-about-tabs" role="tablist" aria-label="About sections">
          <button type="button" class="active" data-ma-about-tab="overview">Overview</button>
          <button type="button" data-ma-about-tab="whatsnew">What’s new</button>
          <button type="button" data-ma-about-tab="legal">Legal</button>
        </div>
        <div class="ma-about-panel active" data-ma-about-panel="overview">
          <div class="ma-about-grid">
            <article class="ma-about-card"><span>App version</span><strong data-ma-info="version"></strong><small>Current app release installed in this build.</small></article>
            <article class="ma-about-card"><span>Save version</span><strong data-ma-info="saveSchema"></strong><small>Helps keep backups compatible across app updates.</small></article>
            <article class="ma-about-card"><span>Build</span><strong data-ma-info="build"></strong><small data-ma-info="buildDate"></small></article>
            <article class="ma-about-card"><span>Install support</span><strong data-ma-info="installSupport"></strong><small>Add Mode Atlas to your device for quicker access.</small></article>
          </div>
          <div class="ma-about-section">
            <h3>Account & save status</h3>
            <div class="ma-about-table">
              <div><span>Save mode</span><strong data-ma-info="saveMode"></strong></div>
              <div><span>Sync status</span><strong data-ma-info="cloudStatus"></strong></div>
              <div><span>Signed in</span><strong data-ma-info="signedIn"></strong></div>
              <div><span>Connection</span><strong data-ma-info="online"></strong></div>
              <div><span>Last cloud sync</span><strong data-ma-info="lastCloudSync"></strong></div>
              <div><span>Local save updated</span><strong data-ma-info="localSaveUpdated"></strong></div>
              <div><span>Storage access</span><strong data-ma-info="storage"></strong></div>
              <div><span>Theme preference</span><strong data-ma-info="theme"></strong></div>
            </div>
          </div>
          <div class="ma-about-section ma-about-credit">
            <h3>Developer</h3>
            <p><strong>Created by ${DEVELOPER}</strong></p>
            <p>Designed and built as a focused Japanese study ecosystem.</p>
            <p>Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> · <a href="https://${OFFICIAL_SITE}/" target="_blank" rel="noopener">${OFFICIAL_SITE}</a></p>
            <p class="ma-about-muted">© 2026 ${DEVELOPER}. All rights reserved.</p>
          </div>
        </div>
        <div class="ma-about-panel" data-ma-about-panel="whatsnew">
          <div class="ma-about-section">
            <h3>What’s new in this build</h3>
            <p class="ma-about-muted">Recent improvements that affect everyday use.</p>
            <ul class="ma-about-list">${whatsNewItems.map(item => `<li>${item}</li>`).join('')}</ul>
            <button type="button" class="ma-about-primary" data-ma-open-whats-new>Open update notes</button>
          </div>
        </div>
        <div class="ma-about-panel" data-ma-about-panel="legal">
          <div class="ma-about-section">
            <h3>Privacy & data</h3>
            <p>Mode Atlas saves learning progress on this device. Signing in lets supported progress follow you across devices.</p>
            <p>Local backups are user-controlled exports. Manual imports prioritise the selected backup for sections it contains, while empty backup sections do not wipe useful current data.</p>
            <p><a href="${aboutAppUrl('privacy/')}" target="_blank" rel="noopener">Open Privacy Policy</a> · <a href="${aboutAppUrl('terms/')}" target="_blank" rel="noopener">Open Terms of Use</a></p>
          </div>
          <div class="ma-about-section">
            <h3>Disclaimer</h3>
            <p>Mode Atlas is a study aid. It is not an official language certification tool and does not guarantee language proficiency outcomes.</p>
          </div>
          <div class="ma-about-section">
            <h3>Credits & ownership</h3>
            <p>Mode Atlas, its app structure, and learning interface are developed by ${DEVELOPER}. Japanese kana characters are part of the Japanese writing system and are not proprietary.</p>
          </div>
        </div>
      </section>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop || event.target.closest('[data-ma-about-close]')) closeAbout();
      const tab = event.target.closest('[data-ma-about-tab]');
      if (tab) switchAboutTab(tab.dataset.maAboutTab);
      if (event.target.closest('[data-ma-open-whats-new]')) {
        event.preventDefault();
        showWhatsNew();
      }
    });
    return backdrop;
  }
  function switchAboutTab(name){
    const modal = ensureAboutModal();
    $all('[data-ma-about-tab]', modal).forEach(button => button.classList.toggle('active', button.dataset.maAboutTab === name));
    $all('[data-ma-about-panel]', modal).forEach(panel => panel.classList.toggle('active', panel.dataset.maAboutPanel === name));
  }
  function renderAbout(){
    const modal = ensureAboutModal();
    const info = getAppInfo();
    Object.entries(info).forEach(([key, value]) => {
      $all(`[data-ma-info="${key}"]`, modal).forEach(node => { node.textContent = String(value); });
    });
  }
  function openAbout(tab = 'overview'){
    renderAbout();
    switchAboutTab(tab);
    ensureAboutModal().classList.add('open');
  }
  function closeAbout(){ $('#maAboutBackdrop')?.classList.remove('open'); }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-ma-about-open]')) {
      event.preventDefault();
      openAbout();
    }
  }, true);

  window.ModeAtlas = window.ModeAtlas || {};
  window.ModeAtlas.openAbout = openAbout;
  window.ModeAtlas.appInfo = getAppInfo;
  window.ModeAtlas.showWhatsNew = showWhatsNew;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleWhatsNew, { once: true });
  else scheduleWhatsNew();
})();
