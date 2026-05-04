(function ModeAtlasDevConsole(){
  'use strict';
  if (window.__modeAtlasDevConsoleLoaded) return;
  window.__modeAtlasDevConsoleLoaded = true;

  const DEV_PIN = '3522';
  const $ = (sel, root = document) => root.querySelector(sel);
  const toast = (message, type = 'info', ms = 2800) => {
    try { return window.ModeAtlas?.toast?.(message, type, ms); } catch { return null; }
  };

  function canUseDevTools(){
    try {
      return !!(
        (window.ModeAtlasEnv && window.ModeAtlasEnv.allowDevTools) ||
        sessionStorage.getItem('modeAtlasDevTools') === '1' ||
        localStorage.getItem('modeAtlasDevTools') === '1'
      );
    } catch { return false; }
  }

  function pageName(){
    try { if (window.ModeAtlasPageName) return String(window.ModeAtlasPageName()).toLowerCase(); } catch {}
    return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function fmtDate(ts){
    const n = Number(ts || 0);
    if (!Number.isFinite(n) || !n) return 'never';
    try { return new Date(n).toLocaleString([], { hour:'numeric', minute:'2-digit', day:'numeric', month:'numeric', year:'2-digit' }); }
    catch { return 'never'; }
  }

  function safeJSON(key, fallback){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  }

  function statTotals(key){
    const stats = safeJSON(key, {});
    let correct = 0, wrong = 0;
    Object.values(stats || {}).forEach(value => {
      if (!value || typeof value !== 'object') return;
      correct += Number(value.correct || value.right || 0);
      wrong += Number(value.wrong || value.incorrect || 0);
    });
    const total = correct + wrong;
    return { correct, wrong, total, accuracy: total ? Math.round((correct / total) * 100) : 0 };
  }

  function countArray(key){
    const value = safeJSON(key, []);
    return Array.isArray(value) ? value.length : 0;
  }

  function devData(){
    const status = window.KanaCloudSync?.getSyncStatus?.() || {};
    let bytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        bytes += (key?.length || 0) + (localStorage.getItem(key)?.length || 0);
      }
    } catch {}
    const reading = statTotals('charStats');
    const writing = statTotals('reverseCharStats');
    const themePref = window.ModeAtlasTheme?.getPreference?.() || localStorage.getItem('modeAtlasThemePreference') || 'system';
    const themeEffective = window.ModeAtlasTheme?.getEffective?.() || themePref;
    return {
      version: (window.ModeAtlasEnv && window.ModeAtlasEnv.appVersion) || window.ModeAtlasVersion || 'dev-local',
      page: pageName(),
      url: location.href,
      theme: `${themePref} / ${themeEffective}`,
      online: navigator.onLine !== false,
      cloudState: status.text || 'n/a',
      cloudLastSync: fmtDate(status.lastSync || localStorage.getItem('modeAtlasLastCloudSyncAt')),
      signedIn: !!status.user,
      localStorageKeys: localStorage.length,
      approximateLocalBytes: bytes,
      safeMode: sessionStorage.getItem('modeAtlasSafeMode') === '1',
      readingAccuracy: reading.accuracy,
      writingAccuracy: writing.accuracy,
      readingAnswers: reading.total,
      writingAnswers: writing.total,
      readingTests: countArray('testModeResults') + countArray('readingTestModeResults') + countArray('kanaTrainerReadingTestModeResults'),
      writingTests: countArray('writingTestModeResults') + countArray('kanaTrainerWritingTestModeResults')
    };
  }

  function escapeHTML(value){
    return String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  }

  function openDevMenu(){
    const pin = prompt('Developer PIN');
    if (pin !== DEV_PIN) {
      if (pin !== null) toast('Incorrect PIN.', 'err');
      return;
    }
    const data = devData();
    let backdrop = $('#maDevMenu');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'maDevMenu';
      backdrop.className = 'ma-dev-backdrop';
      document.body.appendChild(backdrop);
    }
    backdrop.innerHTML = '<div class="ma-dev-modal"><div class="ma-dev-head"><h2>Mode Atlas Dev Diagnostics</h2><button class="ma-ui-btn" type="button" data-ma-dev-close>Close</button></div><div class="ma-dev-actions"><button class="ma-ui-btn" data-ma-dev-copy>Copy diagnostics</button><button class="ma-ui-btn" data-ma-dev-repair>Repair save data</button><button class="ma-ui-btn" data-ma-dev-sync>Force sync</button><button class="ma-ui-btn" data-ma-dev-safe>Safe mode reload</button></div><div class="ma-dev-table">' + Object.entries(data).map(([key, value]) => '<div class="ma-dev-row"><div class="ma-dev-key">' + escapeHTML(key) + '</div><div class="ma-dev-val">' + escapeHTML(String(value)) + '</div></div>').join('') + '</div></div>';
    backdrop.classList.add('open');
    backdrop.onclick = event => {
      if (event.target === backdrop || event.target.closest('[data-ma-dev-close]')) backdrop.classList.remove('open');
      if (event.target.closest('[data-ma-dev-copy]')) navigator.clipboard?.writeText(JSON.stringify(devData(), null, 2)).then(() => toast('Diagnostics copied.'));
      if (event.target.closest('[data-ma-dev-repair]')) {
        const result = window.ModeAtlas?.repairSaveData?.() || { summary: 'repair unavailable' };
        toast('Repair complete · ' + result.summary);
      }
      if (event.target.closest('[data-ma-dev-sync]')) {
        window.KanaCloudSync?.syncNow?.();
        toast('Sync requested.');
      }
      if (event.target.closest('[data-ma-dev-safe]')) {
        sessionStorage.setItem('modeAtlasSafeMode', '1');
        location.reload();
      }
    };
  }

  function installHiddenDevButton(){
    if (!canUseDevTools() || $('#maHiddenDevTrigger')) return;
    const button = document.createElement('button');
    button.id = 'maHiddenDevTrigger';
    button.className = 'ma-hidden-dev-trigger';
    button.type = 'button';
    button.setAttribute('aria-label', 'Developer diagnostics');
    button.addEventListener('click', openDevMenu);
    document.body.appendChild(button);
  }

  window.ModeAtlasDevConsole = { canUseDevTools, open: openDevMenu, data: devData };
  window.dev = function(){
    if (!canUseDevTools()) {
      toast('Developer tools are hidden in this build.');
      return null;
    }
    return openDevMenu();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installHiddenDevButton, { once: true });
  else installHiddenDevButton();
})();
