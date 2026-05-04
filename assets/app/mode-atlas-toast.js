/* Mode Atlas toast notifications: single app-wide notification surface. */
(function ModeAtlasToastModule(){
  if (window.__modeAtlasToastLoaded) return;
  window.__modeAtlasToastLoaded = true;

  function ensureWrap(){
    var wrap = document.querySelector('.ma-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'ma-toast-wrap';
      document.body.appendChild(wrap);
    }
    return wrap;
  }

  function toast(message, type, ms){
    if (!message) return null;
    var wrap = ensureWrap();
    var node = document.createElement('div');
    node.className = 'ma-toast ' + (type || 'ok');
    node.textContent = String(message);
    wrap.appendChild(node);
    window.setTimeout(function(){
      node.style.opacity = '0';
      node.style.transform = 'translateY(8px)';
      window.setTimeout(function(){ node.remove(); }, 220);
    }, Number(ms || 3200));
    return node;
  }

  window.ModeAtlas = window.ModeAtlas || {};
  window.ModeAtlas.toast = toast;
  window.ModeAtlasToast = toast;
})();
