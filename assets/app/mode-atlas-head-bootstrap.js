/* Mode Atlas head bootstrap: service worker cache reset + HTTPS manifest loader. */
/* === mode-atlas-sw-cache-reset.js === */
(function(){
  if (location.protocol === 'file:') return;
  try {
    var key = 'modeAtlasSwReset_v2_9_2';
    if (localStorage.getItem(key) === 'done') return;
    localStorage.setItem(key, 'done');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs){ regs.forEach(function(reg){ reg.unregister(); }); }).catch(function(){});
    }
    if (window.caches) {
      caches.keys().then(function(keys){ keys.filter(function(k){ return /^mode-atlas-/i.test(k); }).forEach(function(k){ caches.delete(k); }); }).catch(function(){});
    }
  } catch(e){}
})();

/* === mode-atlas-manifest.js === */
(function(){
  try {
    if (!/^https?:$/.test(location.protocol)) return;
    if (document.querySelector('link[rel="manifest"]')) return;
    var link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'site.webmanifest';
    document.head.appendChild(link);
  } catch(e) {}
})();
