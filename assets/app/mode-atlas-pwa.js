(function ModeAtlasPwa(){
  'use strict';
  if (window.__modeAtlasPwaLoaded) return;
  window.__modeAtlasPwaLoaded = true;

  const PROMPT_SEEN_KEY = 'modeAtlasInstallPromptSeen';
  const PROMPT_DISMISSED_AT_KEY = 'modeAtlasInstallPromptDismissedAt';
  let deferredPrompt = null;

  function $(sel, root = document){ return root.querySelector(sel); }
  function toast(message){
    try { return window.ModeAtlas?.toast?.(message, 'info', 3600); } catch { return null; }
  }
  function isStandalone(){
    try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
    catch { return false; }
  }
  function hasSeenPrompt(){
    try { return localStorage.getItem(PROMPT_SEEN_KEY) === '1'; } catch { return true; }
  }
  function markPromptSeen(){
    try {
      localStorage.setItem(PROMPT_SEEN_KEY, '1');
      localStorage.setItem(PROMPT_DISMISSED_AT_KEY, String(Date.now()));
    } catch {}
  }
  async function showInstall(){
    if (deferredPrompt) {
      try { deferredPrompt.prompt(); await deferredPrompt.userChoice; } catch {}
      deferredPrompt = null;
      window.ModeAtlasInstall.deferredPrompt = null;
      markPromptSeen();
      $('#maInstallPrompt')?.remove();
      return true;
    }
    const message = 'To install Mode Atlas, use your browser menu or, on iPad, Share → Add to Home Screen.';
    if (!toast(message)) alert(message);
    return false;
  }
  function showInstallPrompt(){
    if ($('#maInstallPrompt') || !deferredPrompt || hasSeenPrompt() || isStandalone()) return;
    const prompt = document.createElement('div');
    prompt.id = 'maInstallPrompt';
    prompt.className = 'ma-install-prompt';
    prompt.innerHTML = '<div><b>Install Mode Atlas</b><span>Add it to your device for faster access and a full-screen study experience. You can also install later from Settings.</span></div><button type="button" data-ma-install>Install</button><button type="button" data-ma-install-close>Not now</button>';
    document.body.appendChild(prompt);
    prompt.addEventListener('click', async event => {
      if (event.target.closest('[data-ma-install-close]')) { markPromptSeen(); prompt.remove(); }
      if (event.target.closest('[data-ma-install]')) await showInstall();
    });
  }

  window.ModeAtlasInstall = Object.assign(window.ModeAtlasInstall || {}, {
    show: showInstall,
    isStandalone,
    hasSeenPrompt,
    markPromptSeen,
    get deferredPrompt(){ return deferredPrompt; },
    set deferredPrompt(value){ deferredPrompt = value; }
  });

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    window.ModeAtlasInstall.deferredPrompt = event;
    if (!hasSeenPrompt() && !isStandalone()) showInstallPrompt();
  });
  window.addEventListener('appinstalled', () => {
    markPromptSeen();
    deferredPrompt = null;
    window.ModeAtlasInstall.deferredPrompt = null;
    $('#maInstallPrompt')?.remove();
  });
})();
