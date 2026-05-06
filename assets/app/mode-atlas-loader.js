/* Mode Atlas loader lifecycle. Owns hiding the app loading screen only. */
/* === mode-atlas-sync-polish.js === */
(function ModeAtlasSyncPolish(){
  if (window.__modeAtlasSyncPolishInstalled) return;
  window.__modeAtlasSyncPolishInstalled = true;

  function hideLoader(){
    localStorage.setItem('modeAtlasLastSyncCheck', String(Date.now()));
    const el = document.getElementById('maLoadingScreen');
    if (el) {
      el.classList.add('done');
      setTimeout(() => el.remove(), 450);
    }
  }

  window.ModeAtlasSyncPolish = { hideLoader };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(hideLoader, 120));
  else setTimeout(hideLoader, 80);
  window.addEventListener('load', () => setTimeout(hideLoader, 80));
  setTimeout(hideLoader, 900);
})();

(function(){
  function done(){ var el=document.getElementById('maLoadingScreen'); if(el){ el.classList.add('done'); setTimeout(function(){ try{el.remove();}catch(e){} }, 450); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(done, 900); }); else setTimeout(done, 900);
  window.addEventListener('load', function(){ setTimeout(done, 400); });
  setTimeout(done, 2500);
})();
