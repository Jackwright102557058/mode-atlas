/* Mode Atlas shared app runtime: display, profile/dev polish, sync polish, profile save clone, late bootstrap/features/auth. */

/* === mode-atlas-display.js === */
(function () {
  const STORAGE_KEY = 'modeAtlasDisplayMode';
  const LEGACY_ALIASES = { compact: 'tablet', mobile: 'phone' };
  const VALID_MODES = new Set(['auto', 'desktop', 'tablet', 'phone']);
  let resizeTimer = 0;

  function normalizeMode(mode) {
    const value = String(mode || 'auto').toLowerCase();
    const normalized = LEGACY_ALIASES[value] || value;
    return VALID_MODES.has(normalized) ? normalized : 'auto';
  }

  function readStoredMode() {
    const raw = window.ModeAtlasStorage?.get ? window.ModeAtlasStorage.get(STORAGE_KEY, 'auto') : (localStorage.getItem(STORAGE_KEY) || 'auto');
    const normalized = normalizeMode(raw);
    if (raw && raw !== normalized && raw !== 'auto') writeStoredMode(normalized);
    return normalized;
  }

  function writeStoredMode(mode) {
    if (window.ModeAtlasStorage?.set) window.ModeAtlasStorage.set(STORAGE_KEY, mode);
    else localStorage.setItem(STORAGE_KEY, mode);
  }

  function getMode() { return readStoredMode(); }

  function resolveAutoMode() {
    const width = Math.min(window.innerWidth || 1200, document.documentElement?.clientWidth || window.innerWidth || 1200);
    if (width <= 700) return 'phone';
    if (width <= 1180) return 'tablet';
    return 'desktop';
  }

  function getEffectiveMode(mode = getMode()) {
    const normalized = normalizeMode(mode);
    return normalized === 'auto' ? resolveAutoMode() : normalized;
  }

  function setMode(mode) {
    const normalized = normalizeMode(mode);
    writeStoredMode(normalized);
    applyMode();
    window.dispatchEvent(new CustomEvent('modeAtlasDisplayModeChanged', { detail: { mode: normalized, effectiveMode: getEffectiveMode(normalized) } }));
  }

  function applyMode() {
    const mode = getMode();
    const effectiveMode = getEffectiveMode(mode);
    const targets = [document.documentElement, document.body].filter(Boolean);
    targets.forEach((target) => {
      target.dataset.displayMode = mode;
      target.dataset.effectiveDisplayMode = effectiveMode;
      target.classList.toggle('ma-display-desktop', effectiveMode === 'desktop');
      target.classList.toggle('ma-display-tablet', effectiveMode === 'tablet');
      target.classList.toggle('ma-display-phone', effectiveMode === 'phone');
    });
    document.querySelectorAll('.ma-display-btn,.ma-display-option').forEach((button) => {
      const buttonMode = normalizeMode(button.dataset.modeAtlasDisplay || button.dataset.display || 'auto');
      button.classList.toggle('active', buttonMode === mode);
      button.setAttribute('aria-pressed', buttonMode === mode ? 'true' : 'false');
    });
  }

  function onResize() {
    if (getMode() !== 'auto') return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applyMode, 80);
  }

  function injectDisplayControls() { applyMode(); }
  window.ModeAtlasDisplay = { getMode, setMode, applyMode, injectDisplayControls, getEffectiveMode, normalizeMode };
  applyMode();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectDisplayControls);
  else injectDisplayControls();
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(applyMode, 120));
  setTimeout(injectDisplayControls, 300);
  setTimeout(injectDisplayControls, 1200);
})();

/* === mode-atlas-profile-dev.js === */
(function ModeAtlasProfileDev(){
  if (window.__modeAtlasProfileDevInstalled) return;
  window.__modeAtlasProfileDevInstalled = true;

  function isTestPage(){
    return /test\.html(?:$|[?#])/i.test(location.pathname) || /\/results\/?$/i.test(location.pathname) || !!document.getElementById('testHeatmap');
  }

  function ensureTestStorageDebugFallback(){
    if (!isTestPage() || typeof window.renderDebugPanel === 'function') return;
    window.closeDebugPanel = function(){
      const panel = document.getElementById('debugPanel');
      if (panel) panel.remove();
    };
    window.renderDebugPanel = function(){
      const keys = ['testModeResults','kanaTrainerTestModeResults','readingTestModeResults','kanaTrainerReadingTestModeResults','writingTestModeResults','kanaTrainerWritingTestModeResults'];
      let panel = document.getElementById('debugPanel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:10000;width:min(420px,calc(100vw - 32px));max-height:70vh;overflow:auto;padding:14px;border-radius:16px;background:rgba(12,12,12,.96);border:1px solid rgba(255,255,255,.12);box-shadow:0 16px 40px rgba(0,0,0,.45);font-family:Arial,sans-serif;font-size:12px;line-height:1.45;color:#f3f3f3';
        document.body.appendChild(panel);
      }
      const rows = keys.map(key => {
        const raw = localStorage.getItem(key);
        let count = 0;
        let err = '';
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            count = Array.isArray(parsed) ? parsed.length : 0;
          } catch (error) {
            err = error.message || 'Invalid JSON';
          }
        }
        return { key, present: raw !== null, count, len: raw ? raw.length : 0, err };
      });
      panel.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;"><div style="font-size:13px;font-weight:800;letter-spacing:.04em;">Storage Debug</div><button type="button" data-debug-close style="border:1px solid rgba(255,255,255,.14);background:#1f1f1f;color:#f3f3f3;border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px;">×</button></div><div style="display:grid;gap:6px;">' + rows.map(item => '<div style="padding:8px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);"><div style="font-weight:700;word-break:break-all;">' + item.key + '</div><div style="color:#bfbfbf;">Present: ' + (item.present ? 'yes' : 'no') + ' · Items: ' + item.count + ' · Raw length: ' + item.len + '</div>' + (item.err ? '<div style="color:#ff9b9b;">Parse error: ' + item.err + '</div>' : '') + '</div>').join('') + '</div>';
      panel.querySelector('[data-debug-close]').onclick = window.closeDebugPanel;
    };
  }

  function getPageDebug(){
    ensureTestStorageDebugFallback();
    const render = window.renderDebugPanel;
    const close = window.closeDebugPanel;
    if (typeof render !== 'function') return null;
    return { label: isTestPage() ? 'Storage debug' : 'SRS debug', closeLabel: isTestPage() ? 'Close storage debug' : 'Close debug', render, close: typeof close === 'function' ? close : null };
  }

  function ensureDevPanel(){
    if (document.getElementById('maDevPanel')) return;
    const pageDebug = getPageDebug();
    const panel = document.createElement('div');
    panel.className = 'ma-dev-panel';
    panel.id = 'maDevPanel';
    panel.innerHTML = '<div class="ma-dev-card" role="dialog" aria-modal="false" aria-labelledby="maDevTitle"><div class="ma-dev-head"><div class="ma-dev-title" id="maDevTitle">Dev menu</div><button class="ma-dev-btn" type="button" data-ma-dev-close>Close</button></div>' + (pageDebug ? '<div class="ma-dev-row"><div class="ma-dev-label">Page tools</div><div class="ma-dev-actions"><button class="ma-dev-btn" type="button" data-ma-dev-page-debug>' + pageDebug.label + '</button>' + (pageDebug.close ? '<button class="ma-dev-btn" type="button" data-ma-dev-page-debug-close>' + pageDebug.closeLabel + '</button>' : '') + '</div></div>' : '') + '<div class="ma-dev-row"><div class="ma-dev-label">Console</div><div style="color:var(--muted,#9aa3b8);font-size:13px;line-height:1.5;">Open this panel with <strong>dev()</strong>. It stays in the bottom-right so the page remains usable.</div></div></div>';
    document.body.appendChild(panel);
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-ma-dev-close]')) closeDev();
      if (event.target.closest('[data-ma-dev-page-debug]')) {
        try { getPageDebug()?.render(); } catch (error) { console.warn('Debug panel unavailable', error); }
      }
      if (event.target.closest('[data-ma-dev-page-debug-close]')) {
        try { getPageDebug()?.close?.(); } catch (error) { console.warn('Close debug unavailable', error); }
      }
    });
  }

  function openDev(){ ensureDevPanel(); document.getElementById('maDevPanel')?.classList.add('open'); }
  function closeDev(){ document.getElementById('maDevPanel')?.classList.remove('open'); }
  function init(){ ensureDevPanel(); }

  window.dev = openDev;
  window.atlasDev = openDev;
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDev(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

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

/* Shared profile drawer is provided by assets/ui/mode-atlas-profile-drawer-bindings.js. */

/* === mode-atlas-late-bootstrap.js === */
/* Shared late bootstrap: visit flow, save/sync UI, loading failsafe. */
(function(){
  if(window.__modeAtlasVisitFlowsLoaded)return; window.__modeAtlasVisitFlowsLoaded=true;
  const K={first:'modeAtlasStarterSeen',return:'modeAtlasDailyReturnSeenDate',lastVisit:'modeAtlasLastVisitStudyDate',streak:'modeAtlasVisitStreak',lastStudied:'modeAtlasLastStudiedAt',lastMode:'modeAtlasLastMode',forceFirst:'modeAtlasForceFirstVisit',forceReturn:'modeAtlasForceDailyReturn'};
  const page=()=>((window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase()||'index.html');
  const j=(k,f)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}};
  const hasObj=k=>{const v=j(k,null);return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length>0};
  const hasArr=k=>Array.isArray(j(k,null))&&j(k,[]).length>0;
  const studyDate=(d=new Date())=>{const x=new Date(d);if(x.getHours()<4)x.setDate(x.getDate()-1);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function hasData(){return hasObj('charStats')||hasObj('reverseCharStats')||hasObj('scoreHistory')||hasObj('reverseScoreHistory')||hasArr('kanaWordBank')||hasArr('testModeResults')||hasArr('writingTestModeResults')||Number(localStorage.getItem('highScore')||0)>0||Number(localStorage.getItem('reverseHighScore')||0)>0}
  function diff(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)}
  function streak(){const t=studyDate(),l=localStorage.getItem(K.lastVisit);let s=Number(localStorage.getItem(K.streak)||0);if(l!==t){s=(l&&diff(l,t)===1)?s+1:1;localStorage.setItem(K.lastVisit,t);localStorage.setItem(K.streak,String(s))}return s||1}
  function ago(ts){ts=Number(ts||0);if(!ts)return'No study recorded yet';const m=Math.floor(Math.max(0,Date.now()-ts)/60000);if(m<1)return'Just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`}
  function mode(kind){const s=j(kind==='writing'?'reverseSettings':'settings',{});if(s.testMode)return'Test Mode';if(s.dailyChallenge)return'Daily Challenge';if(s.comboKana)return'Combo Kana Mode';if(s.timeTrial)return'Time Trial Mode';if(s.endless)return'Endless Mode';if(s.focusWeak)return'Focus Weak';return'Standard Mode'}
  function record(kind){const obj=kind==='writing'?{branch:'Kana Trainer',page:'Writing Practice',href:'reverse.html',mode:mode('writing')}:{branch:'Kana Trainer',page:'Reading Practice',href:'default.html',mode:mode('reading')};localStorage.setItem(K.lastStudied,String(Date.now()));localStorage.setItem(K.lastMode,JSON.stringify(obj))}
  function track(){const p=page();if(p==='default.html'||p==='reverse.html'){const kind=p==='reverse.html'?'writing':'reading';document.addEventListener('click',e=>{if(e.target.closest('#startBtn,#endSessionBtn,#retryBtn,.choice-btn,#choiceGrid,.btn'))record(kind)},{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Enter')record(kind)},{passive:true})}else if(p==='wordbank.html'){document.addEventListener('click',e=>{if(e.target.closest('#addWordBtn,[data-action="save"],[data-action="favorite"]')){localStorage.setItem(K.lastStudied,String(Date.now()));localStorage.setItem(K.lastMode,JSON.stringify({branch:'Word Bank',page:'Word Bank',href:'wordbank.html',mode:'Vocabulary Review'}))}},{passive:true})}}
  const ROWS=[['あ row','あいうえお'],['か row','かきくけこ'],['さ row','さしすせそ'],['た row','たちつてと'],['な row','なにぬねの'],['は row','はひふへほ'],['ま row','まみむめも'],['や row','やゆよ'],['ら row','らりるれろ'],['わ row','わをん'],['ア row','アイウエオ'],['カ row','カキクケコ'],['サ row','サシスセソ'],['タ row','タチツテト'],['ナ row','ナニヌネノ']];
  function suggestions(){const st=j('charStats',{}),tm=j('charTimes',{});const a=ROWS.map(([name,chars])=>{let c=0,w=0,ms=0,n=0;[...chars].forEach(ch=>{c+=Number(st[ch]?.correct||0);w+=Number(st[ch]?.wrong||0);if(tm[ch]?.avg&&tm[ch]?.count){ms+=tm[ch].avg*tm[ch].count;n+=tm[ch].count}});const total=c+w,acc=total?c/total:1;return{name,total,score:w*4+(1-acc)*50+Math.min((n?ms/n:0)/500,12)+(total?0:-100)}}).filter(r=>r.total>0).sort((a,b)=>b.score-a.score).slice(0,3);return a.length?a:[{name:'あ row'},{name:'か row'},{name:'さ row'}]}
  function name(){const u=window.KanaCloudSync?.getUser?.();const n=(u?.displayName||u?.email||'').trim();if(n)return n.split(/\s+/)[0].split('@')[0];for(const id of ['profileName','drawerName','studyProfileName','identityName']){const e=document.getElementById(id),t=(e?.textContent||'').trim();if(t&&!/guest/i.test(t))return t.split(/\s+/)[0]}return'there'}
  function appBasePath(){
    try {
      const marker = '/assets/';
      const scripts = Array.from(document.scripts || []);
      const runtime = scripts.find(script => String(script.src || '').includes('/assets/app/mode-atlas-app-runtime.js'));
      if (runtime && runtime.src) return new URL(runtime.src.slice(0, runtime.src.indexOf(marker) + 1)).pathname;
    } catch {}
    return '/';
  }
  function appUrl(path){
    const clean = String(path || '').replace(/^\/+/, '');
    try { return new URL(clean, location.origin + appBasePath()).pathname; } catch { return '/' + clean; }
  }
  function legalUrl(kind){ return appUrl(kind === 'terms' ? 'terms/' : 'privacy/'); }
  function readingPresetUrl(preset){ return appUrl('reading/?starter=' + encodeURIComponent(preset || 'starter')); }
  function ensure(){
    if(document.getElementById('maVisitModal'))return;
    const css=document.createElement('style');
    css.textContent='.ma-visit-backdrop{position:fixed;inset:0;z-index:240;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}.ma-visit-backdrop.open{display:flex}.ma-visit-card{width:min(640px,100%);max-height:min(92vh,820px);overflow:auto;border-radius:28px;padding:22px;background:radial-gradient(circle at top right,rgba(125,181,255,.16),transparent 34%),linear-gradient(180deg,rgba(22,25,34,.98),rgba(8,10,16,.98));border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 90px rgba(0,0,0,.55);color:var(--text,#f7f8ff)}.ma-visit-kicker{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#9aa3b8);margin-bottom:10px}.ma-visit-title{font-size:30px;line-height:1.04;font-weight:950;letter-spacing:-.04em;margin:0 0 10px}.ma-visit-copy{color:var(--soft,#cbd5e1);line-height:1.55;margin:0 0 18px;font-size:15px}.ma-visit-panel{border-radius:20px;padding:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);margin:12px 0}.ma-visit-label{font-size:12px;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:var(--muted,#9aa3b8);margin-bottom:8px}.ma-visit-list{display:flex;flex-wrap:wrap;gap:8px}.ma-visit-chip{padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);font-size:13px;font-weight:800}.ma-visit-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ma-visit-preset{appearance:none;width:100%;text-align:left;border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.055);color:inherit;padding:13px 14px;cursor:pointer;display:grid;gap:4px;min-height:86px}.ma-visit-preset:hover,.ma-visit-preset:focus-visible{background:rgba(125,181,255,.13);border-color:rgba(125,181,255,.48);outline:none}.ma-visit-preset.selected,.ma-visit-preset[aria-pressed="true"]{background:linear-gradient(135deg,rgba(125,181,255,.24),rgba(167,139,250,.18));border-color:rgba(125,181,255,.82);box-shadow:0 0 0 3px rgba(125,181,255,.16),0 12px 30px rgba(0,0,0,.22)}.ma-visit-preset.selected span,.ma-visit-preset[aria-pressed="true"] span{color:#ffffff}.ma-visit-preset.selected small,.ma-visit-preset[aria-pressed="true"] small{color:#dbeafe}.ma-visit-preset span{font-size:15px;font-weight:950}.ma-visit-preset small{font-size:12px;color:var(--soft,#cbd5e1);font-weight:750;line-height:1.35}.ma-visit-legal{display:grid;gap:12px;margin-top:14px}.ma-visit-legal-links{display:flex;flex-wrap:wrap;gap:10px;color:var(--soft,#cbd5e1);font-size:13px}.ma-visit-legal-links a{color:#9ec5ff;font-weight:900;text-decoration:none}.ma-visit-legal-links a:hover{text-decoration:underline}.ma-visit-link-note{color:var(--muted,#9aa3b8);font-size:12px;font-weight:800}.ma-visit-check{display:flex;align-items:flex-start;gap:10px;border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.045);padding:12px 13px;color:var(--soft,#cbd5e1);font-size:13px;line-height:1.4}.ma-visit-check input{width:19px;height:19px;flex:0 0 auto;margin:0;accent-color:#7db5ff}.ma-visit-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.ma-visit-btn{appearance:none;border:1px solid rgba(255,255,255,.10);border-radius:15px;padding:12px 14px;background:rgba(255,255,255,.06);color:inherit;text-decoration:none;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-height:44px}.ma-visit-btn.primary{background:rgba(255,255,255,.08);color:rgba(247,248,255,.62);border-color:rgba(255,255,255,.10)}.ma-visit-btn.primary.ready,.ma-visit-btn.primary:not(:disabled){background:linear-gradient(135deg,rgba(125,181,255,.96),rgba(167,139,250,.92));color:#07111f;border-color:transparent;box-shadow:0 14px 34px rgba(0,0,0,.28),0 0 0 3px rgba(125,181,255,.14)}.ma-visit-btn:disabled{cursor:not-allowed;opacity:.72;filter:saturate(.65)}.ma-visit-error{display:none;margin-top:10px;color:#ffd2d2;font-size:13px;font-weight:800}.ma-visit-error.show{display:block}@media(max-width:640px){.ma-visit-card{padding:18px;border-radius:22px}.ma-visit-title{font-size:25px}.ma-visit-presets{grid-template-columns:1fr}.ma-visit-actions{display:grid}.ma-visit-btn{width:100%}}';
    document.head.appendChild(css);
    const m=document.createElement('div');
    m.id='maVisitModal';
    m.className='ma-visit-backdrop';
    m.innerHTML='<div class="ma-visit-card" role="dialog" aria-modal="true"><div id="maVisitContent"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click',e=>{if(e.target===m)closeModal()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()})
  }
  function closeModal(force){const modal=document.getElementById('maVisitModal'); if(!modal)return; if(modal.dataset.locked==='true' && force!==true)return; modal.classList.remove('open'); modal.dataset.locked='false'}
  function first(){
    ensure();
    const c=document.getElementById('maVisitContent');
    const presets=[
      ['starter','Starter','あ row + hint mode. Best if kana is brand new.'],
      ['intermediate','Intermediate','All hiragana rows with hints off.'],
      ['advanced','Advanced','Hiragana, katakana, and dakuten.'],
      ['pro','Pro','Everything enabled, including yōon and extended katakana.']
    ];
    c.innerHTML='<div class="ma-visit-kicker">Mode Atlas setup</div><h2 class="ma-visit-title">Welcome to Mode Atlas</h2><p class="ma-visit-copy">Choose a starting preset for Mode Atlas. This sets your first study session layout for all our branches and can be changed or customised later. We will also send you to Kana Trainer - Reading mode to get you started.</p><div class="ma-visit-panel"><div class="ma-visit-label">Study presets</div><div class="ma-visit-presets">'+presets.map(p=>'<button class="ma-visit-preset" type="button" data-ma-onboarding-preset="'+esc(p[0])+'" aria-pressed="false"><span>'+esc(p[1])+'</span><small>'+esc(p[2])+'</small></button>').join('')+'</div></div><div class="ma-visit-legal"><div class="ma-visit-legal-links"><a href="'+esc(legalUrl('privacy'))+'" target="_blank" rel="noopener">Privacy Policy</a><a href="'+esc(legalUrl('terms'))+'" target="_blank" rel="noopener">Terms of Use</a><span class="ma-visit-link-note">These open in a new tab so setup stays open.</span></div><label class="ma-visit-check"><input type="checkbox" data-legal-agree><span>I agree to the Privacy Policy and Terms of Use.</span></label></div><div class="ma-visit-error" data-setup-error>Please choose a preset and agree before beginning.</div><div class="ma-visit-actions"><button class="ma-visit-btn primary" type="button" data-begin disabled aria-disabled="true">Begin!</button></div>';
    let selected='';
    const begin=c.querySelector('[data-begin]');
    const agree=c.querySelector('[data-legal-agree]');
    const err=c.querySelector('[data-setup-error]');
    function setSelected(btn){
      selected=btn?.getAttribute('data-ma-onboarding-preset')||'';
      c.querySelectorAll('[data-ma-onboarding-preset]').forEach(b=>{
        const on=b===btn;
        b.classList.toggle('selected',on);
        b.setAttribute('aria-pressed',on?'true':'false');
      });
      refresh();
    }
    function refresh(){
      const ready=Boolean(selected && agree && agree.checked);
      begin.disabled=!ready;
      begin.setAttribute('aria-disabled',ready?'false':'true');
      begin.classList.toggle('ready',ready);
      c.classList.toggle('ma-visit-ready',ready);
      if(ready) err.classList.remove('show');
    }
    c.addEventListener('click', event=>{
      const preset=event.target.closest('[data-ma-onboarding-preset]');
      if(preset && c.contains(preset)){ event.preventDefault(); setSelected(preset); }
    });
    agree.addEventListener('change', refresh);
    agree.addEventListener('input', refresh);
    begin.addEventListener('click', ()=>{
      if(begin.disabled){err.classList.add('show');return;}
      const applied = window.ModeAtlasPresets?.apply?.(selected, { target: 'both', source: 'onboarding' });
      if(!applied){err.classList.add('show');return;}
      localStorage.setItem(K.first,'true');
      localStorage.setItem('modeAtlasOnboardingComplete','true');
      localStorage.setItem('modeAtlasLegalAccepted','true');
      localStorage.setItem('modeAtlasLegalAcceptedAt',String(Date.now()));
      localStorage.setItem('modeAtlasLegalVersion','2026-05');
      sessionStorage.setItem('modeAtlasShowWhatsNewAfterOnboarding','1');
      closeModal(true);
      location.href=appUrl('reading/');
    });
    const modal=document.getElementById('maVisitModal');
    modal.dataset.locked='true';
    modal.classList.add('open');
    refresh();
  }
  function ret(){ensure();localStorage.setItem(K.return,studyDate());const lm=j(K.lastMode,{page:'Reading Practice',mode:'Endless Mode',href:'default.html'}),s=suggestions(),st=streak();const c=document.getElementById('maVisitContent');c.innerHTML=`<div class="ma-visit-kicker">Daily return</div><h2 class="ma-visit-title">Welcome back, ${esc(name())}</h2><p class="ma-visit-copy">Last studied: <strong>${esc(ago(localStorage.getItem(K.lastStudied)))}</strong><br>Current streak: <strong>${st} day${st===1?'':'s'}</strong></p><div class="ma-visit-panel"><div class="ma-visit-label">Suggested review</div><div class="ma-visit-list">${s.map(r=>`<span class="ma-visit-chip">${esc(r.name)}</span>`).join('')}</div></div><div class="ma-visit-panel"><div class="ma-visit-label">Resume</div><div class="ma-visit-list"><span class="ma-visit-chip">${esc(lm.page||'Reading Practice')} · ${esc(lm.mode||'Endless Mode')}</span></div></div><div class="ma-visit-actions"><a class="ma-visit-btn primary" href="${esc(lm.href||'default.html')}">Resume</a><button class="ma-visit-btn" type="button" data-close>Not now</button></div>`;c.querySelector('[data-close]').onclick=closeModal;document.getElementById('maVisitModal').classList.add('open')}
  function maybe(){if(page()!=='index.html')return;const q=new URLSearchParams(location.search),ff=sessionStorage.getItem(K.forceFirst)==='1'||q.has('devFirstVisit')||q.has('setup'),fr=sessionStorage.getItem(K.forceReturn)==='1'||q.has('devReturn');sessionStorage.removeItem(K.forceFirst);sessionStorage.removeItem(K.forceReturn);localStorage.removeItem(K.forceFirst);localStorage.removeItem(K.forceReturn);setTimeout(async()=>{try{if(window.KanaCloudSync?.ready)await Promise.race([window.KanaCloudSync.ready,new Promise(r=>setTimeout(r,900))])}catch{}if(ff)return first();if(fr)return ret();const nd=!hasData();if(nd&&localStorage.getItem(K.first)!=='true')return first();if(!nd){const t=studyDate();if(localStorage.getItem(K.return)!==t)return ret();streak()}},650)}
  function triggerFirst(){localStorage.removeItem(K.forceFirst);sessionStorage.removeItem(K.forceFirst);if(page()==='index.html')first();else{sessionStorage.setItem(K.forceFirst,'1');location.href='/?devFirstVisit=1'}}
  function triggerReturn(){localStorage.removeItem(K.forceReturn);sessionStorage.removeItem(K.forceReturn);if(page()==='index.html')ret();else{sessionStorage.setItem(K.forceReturn,'1');location.href='/?devReturn=1'}}
  function reset(){[K.first,K.return,K.forceFirst,K.forceReturn,K.lastVisit,K.streak].forEach(k=>localStorage.removeItem(k));console.info('Mode Atlas visit flags reset')}
  window.modeAtlasTriggerFirstVisit=triggerFirst;window.modeAtlasTriggerDailyReturn=triggerReturn;window.modeAtlasResetVisitFlags=reset;
  function addDev(){const p=document.getElementById('maDevPanel');if(!p||p.querySelector('[data-visit-tools]'))return;const card=p.querySelector('.ma-dev-card')||p,row=document.createElement('div');row.className='ma-dev-row';row.dataset.visitTools='true';row.innerHTML='<div class="ma-dev-label">Visit flows</div><div class="ma-dev-actions"><button class="ma-dev-btn" type="button" data-first>Trigger first visit</button><button class="ma-dev-btn" type="button" data-return>Trigger daily return</button><button class="ma-dev-btn" type="button" data-reset>Reset visit flags</button></div>';row.onclick=e=>{if(e.target.closest('[data-first]'))triggerFirst();if(e.target.closest('[data-return]'))triggerReturn();if(e.target.closest('[data-reset]'))reset()};card.appendChild(row)}
  function patchDev(){if(!window.ModeAtlasEnv?.allowDevTools)return;const o=window.dev;if(typeof o==='function'&&!o.__visitPatched){const p=function(){const r=o.apply(this,arguments);setTimeout(addDev,0);return r};p.__visitPatched=true;window.dev=p;window.atlasDev=p}new MutationObserver(addDev).observe(document.documentElement,{childList:true,subtree:true});setTimeout(addDev,500)}
  function init(){track();maybe();patchDev()} if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
(function ModeAtlasUnifiedSaveSyncUi(){
  if (window.__modeAtlasUnifiedSaveSyncUiLoaded) return;
  window.__modeAtlasUnifiedSaveSyncUiLoaded = true;

  // Save/import controls are rendered by assets/ui/mode-atlas-settings-menu.js.


  const RESET_WARNING = 'Reset all Mode Atlas data?\n\nThis clears local save data on this device. If you are signed in and cloud is available, it also clears the cloud save data for this account. This cannot be undone.';

  function fallbackBackup(){
    const data = {};
    const block = /^(firebase:|firestore|google|__|debug|devtools)/i;
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k || block.test(k)) continue;
      data[k] = localStorage.getItem(k);
    }
    return { app: 'Mode Atlas', version: 2, exportedAt: new Date().toISOString(), data };
  }

  function getBackup(){
    try { return window.KanaCloudSync?.createBackup?.() || fallbackBackup(); }
    catch { return fallbackBackup(); }
  }

  function setStatus(message){
    document.querySelectorAll('#profileStatus,#studyProfileStatus,#identityStatus,#wordBankCloudStatus').forEach((el) => {
      if (el) el.textContent = message;
    });
  }

  function downloadBackup(){
    const backup = getBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mode-atlas-save-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Save exported.');
    refreshSyncPills();
  }

  async function copyBackup(){
    const txt = JSON.stringify(getBackup(), null, 2);
    try {
      await navigator.clipboard.writeText(txt);
      setStatus('Save copied.');
    } catch {
      downloadBackup();
    }
    refreshSyncPills();
  }



  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
  }

  function fallbackImportPreview(parsed){
    const data = parsed?.data || parsed?.localStorage || parsed;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid save file');
    const has = (key) => Object.prototype.hasOwnProperty.call(data, key);
    const readArray = (key) => {
      if (!has(key)) return [];
      const value = data[key];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try { const parsedValue = JSON.parse(value); return Array.isArray(parsedValue) ? parsedValue : []; }
        catch { return []; }
      }
      return [];
    };
    const countObj = (key) => {
      if (!has(key)) return 0;
      const value = data[key];
      let parsedValue = value;
      if (typeof value === 'string') {
        try { parsedValue = JSON.parse(value); } catch { parsedValue = null; }
      }
      return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue) ? Object.keys(parsedValue).length : 0;
    };
    const sections = [
      { name:'reading', label:'Reading Practice', current: Object.keys(JSON.parse(localStorage.getItem('charStats') || '{}')).length + ' kana stats', incoming: countObj('charStats') + ' kana stats', willImport: has('charStats') || has('settings') || has('charTimes') || has('charSrs') },
      { name:'writing', label:'Writing Practice', current: Object.keys(JSON.parse(localStorage.getItem('reverseCharStats') || '{}')).length + ' kana stats', incoming: countObj('reverseCharStats') + ' kana stats', willImport: has('reverseCharStats') || has('reverseSettings') || has('reverseCharTimes') || has('reverseCharSrs') },
      { name:'readingTests', label:'Reading Test Results', current: readArrayFromLocal('testModeResults').length + ' reading tests', incoming: Math.max(readArray('testModeResults').length, readArray('readingTestModeResults').length, readArray('kanaTrainerTestModeResults').length).toString() + ' reading tests', willImport: has('testModeResults') || has('readingTestModeResults') || has('kanaTrainerTestModeResults') },
      { name:'writingTests', label:'Writing Test Results', current: readArrayFromLocal('writingTestModeResults').length + ' writing tests', incoming: Math.max(readArray('writingTestModeResults').length, readArray('reverseTestModeResults').length).toString() + ' writing tests', willImport: has('writingTestModeResults') || has('reverseTestModeResults') },
      { name:'wordBank', label:'Word Bank', current: readArrayFromLocal('kanaWordBank').length + ' word bank items', incoming: readArray('kanaWordBank').length + ' word bank items', willImport: has('kanaWordBank') }
    ].map((section) => ({ ...section, action: section.willImport ? 'Will replace from backup' : 'Will keep current data' }));
    return { exportedAt: Date.parse(parsed?.exportedAt || '') || 0, sections };
  }

  function readArrayFromLocal(key){
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }

  function buildImportPreview(parsed){
    if (window.KanaCloudSync?.previewLocalBackup) return window.KanaCloudSync.previewLocalBackup(parsed);
    return fallbackImportPreview(parsed);
  }

  function closeImportConfirm(){
    document.getElementById('maImportConfirmModal')?.classList.remove('open');
  }

  function ensureImportConfirmModal(){
    let modal = document.getElementById('maImportConfirmModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'maImportConfirmModal';
    modal.className = 'ma-import-confirm-backdrop';
    modal.innerHTML = '<div class="ma-import-confirm-card" role="dialog" aria-modal="true" aria-labelledby="maImportConfirmTitle">' +
      '<div class="ma-import-confirm-head">' +
        '<div><div class="ma-import-confirm-kicker">Save import</div><h2 id="maImportConfirmTitle">Review imported save</h2></div>' +
        '<button class="ma-import-confirm-x" type="button" data-ma-import-cancel aria-label="Cancel import">×</button>' +
      '</div>' +
      '<p class="ma-import-confirm-copy">Manual imports use the selected backup for any section that contains real data. Empty backup sections will not erase useful current data.</p>' +
      '<div class="ma-import-confirm-meta" data-ma-import-meta></div>' +
      '<div class="ma-import-confirm-table" data-ma-import-table></div>' +
      '<div class="ma-import-confirm-actions">' +
        '<button type="button" class="ma-import-confirm-button" data-ma-import-cancel>Cancel</button>' +
        '<button type="button" class="ma-import-confirm-button ma-primary" data-ma-import-continue>Continue import</button>' +
      '</div>' +
    '</div>';
    document.body.appendChild(modal);
    return modal;
  }

  function formatImportDate(ts){
    const n = Number(ts || 0);
    if (!Number.isFinite(n) || !n) return 'unknown export date';
    const date = new Date(n);
    if (Number.isNaN(date.getTime())) return 'unknown export date';
    return date.toLocaleString([], { day:'numeric', month:'short', year:'numeric', hour:'numeric', minute:'2-digit' });
  }

  function showImportConfirm(parsed){
    const preview = buildImportPreview(parsed);
    const modal = ensureImportConfirmModal();
    const meta = modal.querySelector('[data-ma-import-meta]');
    const table = modal.querySelector('[data-ma-import-table]');
    const importing = (preview.sections || []).filter((section) => section.willImport).length;
    meta.innerHTML = '<span>Backup exported: <strong>' + escapeHtml(formatImportDate(preview.exportedAt)) + '</strong></span>' +
      '<span>Sections to import: <strong>' + importing + '</strong></span>';
    table.innerHTML = '<div class="ma-import-confirm-row head"><span>Section</span><span>Current loaded</span><span>Imported save</span><span>Action</span></div>' +
      (preview.sections || []).map((section) => '<div class="ma-import-confirm-row">' +
        '<span><strong>' + escapeHtml(section.label) + '</strong></span>' +
        '<span>' + escapeHtml(section.current) + '</span>' +
        '<span>' + escapeHtml(section.incoming) + '</span>' +
        '<span class="' + (section.willImport ? 'will-import' : 'will-keep') + '">' + escapeHtml(section.action) + '</span>' +
      '</div>').join('');
    modal.classList.add('open');
    return new Promise((resolve) => {
      const continueBtn = modal.querySelector('[data-ma-import-continue]');
      const cancelButtons = modal.querySelectorAll('[data-ma-import-cancel]');
      const cleanup = () => {
        continueBtn.onclick = null;
        cancelButtons.forEach((button) => { button.onclick = null; });
        modal.onclick = null;
        document.removeEventListener('keydown', onKeydown, true);
      };
      const finish = (accepted) => { cleanup(); closeImportConfirm(); resolve(accepted); };
      const onKeydown = (event) => { if (event.key === 'Escape') finish(false); };
      continueBtn.onclick = () => finish(true);
      cancelButtons.forEach((button) => { button.onclick = () => finish(false); });
      modal.onclick = (event) => { if (event.target === modal) finish(false); };
      document.addEventListener('keydown', onKeydown, true);
    });
  }

  async function applyImportPayload(parsed){
    if (window.KanaCloudSync?.importLocalBackup) {
      return window.KanaCloudSync.importLocalBackup(parsed);
    }
    const data = parsed.data || parsed.localStorage || parsed;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid save file');
    Object.entries(data).forEach(([k,v]) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
    return { updated: ['local'], keptLocal: [], cloudSynced: false };
  }

  async function previewAndImport(parsed, options = {}){
    const confirmed = await showImportConfirm(parsed);
    if (!confirmed) {
      setStatus('Import cancelled.');
      return false;
    }
    setStatus('Importing backup...');
    const result = await applyImportPayload(parsed);
    setStatus('Save imported. Reloading...');
    if (typeof options.afterImport === 'function') options.afterImport(result);
    else setTimeout(() => location.reload(), 350);
    return true;
  }

  async function importBackupFile(file){
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text || '{}');
      setStatus('Review import before continuing...');
      await previewAndImport(parsed);
    } catch (error) {
      console.warn('Save import failed.', error);
      setStatus('Import failed. Please choose a valid Mode Atlas save file.');
    }
  }

  window.ModeAtlasImportUi = { previewAndImport, buildImportPreview };

  async function resetData(){
    if (!confirm(RESET_WARNING)) return;
    try {
      setStatus('Resetting save data...');
      if (window.KanaCloudSync?.ready) await window.KanaCloudSync.ready;
      if (window.KanaCloudSync?.resetAllData) await window.KanaCloudSync.resetAllData();
      else { localStorage.clear(); sessionStorage.clear(); }
      location.href = 'index.html';
    } catch (error) {
      console.warn('Reset failed.', error);
      alert('Reset failed. Please check your connection and try again.');
      setStatus('Reset failed.');
    }
  }

  function statusFallback(){
    const user = window.KanaCloudSync?.getUser?.();
    const lastSync = Number(localStorage.getItem('modeAtlasLastCloudSyncAt') || 0);
    if (!user) return { tone: 'local', text: 'Local saving · log in for cloud save' };
    if (navigator.onLine === false) return { tone: 'warning', text: 'No cloud access · last sync ' + (lastSync ? new Date(lastSync).toLocaleString([], { hour:'numeric', minute:'2-digit', day:'numeric', month:'numeric', year:'2-digit' }) : 'never') };
    return { tone: 'ok', text: 'Cloud save synced' };
  }

  function getSyncStatus(){
    try { return window.KanaCloudSync?.getSyncStatus?.() || statusFallback(); }
    catch { return statusFallback(); }
  }

  function refreshSyncPills(){
    window.ModeAtlasProfile?.refresh?.();
  }

  function ensureStyle(){
    if (document.getElementById('ma-unified-save-sync-style')) return;
    const style = document.createElement('style');
    style.id = 'ma-unified-save-sync-style';
    style.textContent = '.ma-import-confirm-backdrop{position:fixed;inset:0;z-index:10050;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,6,12,.72);backdrop-filter:blur(12px)}.ma-import-confirm-backdrop.open{display:flex}.ma-import-confirm-card{width:min(760px,100%);max-height:min(82vh,760px);overflow:auto;border-radius:24px;background:rgba(17,24,39,.98);border:1px solid rgba(255,255,255,.13);box-shadow:0 24px 70px rgba(0,0,0,.48);padding:20px;color:var(--text,#f6f7fb)}.ma-import-confirm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:10px}.ma-import-confirm-kicker{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#9aa3b8)}.ma-import-confirm-card h2{margin:3px 0 0;font-size:24px;line-height:1.15}.ma-import-confirm-copy{margin:0 0 14px;color:var(--muted,#9aa3b8);line-height:1.5}.ma-import-confirm-x{width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:var(--text,#f6f7fb);font-size:24px;line-height:1;cursor:pointer}.ma-import-confirm-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.ma-import-confirm-meta span{padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);font-size:12px;color:var(--muted,#9aa3b8)}.ma-import-confirm-table{display:grid;gap:8px}.ma-import-confirm-row{display:grid;grid-template-columns:1.05fr 1fr 1fr 1.05fr;gap:10px;align-items:center;padding:10px;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);font-size:13px}.ma-import-confirm-row.head{font-weight:900;color:var(--muted,#9aa3b8);background:transparent;border-color:transparent;padding-bottom:2px}.ma-import-confirm-row span{min-width:0}.ma-import-confirm-row .will-import{color:#bcf7cb;font-weight:900}.ma-import-confirm-row .will-keep{color:#ffe0aa;font-weight:900}.ma-import-confirm-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}.ma-import-confirm-actions button{min-width:132px}.ma-import-confirm-button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 14px;border-radius:14px;border:1px solid rgba(148,163,184,.22);background:rgba(15,23,42,.72);color:var(--text,#f6f7fb);font-weight:850;cursor:pointer}.ma-import-confirm-button.ma-primary{background:rgba(45,72,118,.82);border-color:rgba(125,181,255,.44)}.ma-import-confirm-button:hover{background:rgba(30,41,59,.86)}.ma-import-preview-backdrop{display:none!important}@media(max-width:700px){.ma-save-grid{grid-template-columns:1fr!important}.ma-import-confirm-card{padding:16px}.ma-import-confirm-row{grid-template-columns:1fr;gap:4px}.ma-import-confirm-row.head{display:none}.ma-import-confirm-actions{display:grid;grid-template-columns:1fr}.ma-import-confirm-actions button{width:100%}}';
    document.head.appendChild(style);
  }

  function rebuildSaveSections(){
    ensureStyle();
    refreshSyncPills();
  }


  document.addEventListener('click', (event) => {
    const exportBtn = event.target.closest('[data-ma-unified-export]');
    const copyBtn = event.target.closest('[data-ma-unified-copy]');
    const importBtn = event.target.closest('[data-ma-unified-import]');
    const resetBtn = event.target.closest('[data-ma-unified-reset]');
    if (!exportBtn && !copyBtn && !importBtn && !resetBtn) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (exportBtn) downloadBackup();
    if (copyBtn) copyBackup();
    if (importBtn) importBtn.closest('.ma-save-section')?.querySelector('[data-ma-unified-file]')?.click();
    if (resetBtn) resetData();
  }, true);

  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-ma-unified-file]');
    if (!input) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    importBackupFile(input.files && input.files[0]);
    input.value = '';
  }, true);

  function boot(){
    rebuildSaveSections();
    setTimeout(rebuildSaveSections, 300);
    setTimeout(rebuildSaveSections, 1200);
    setTimeout(refreshSyncPills, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('kanaCloudSyncStatusChanged', refreshSyncPills);
  window.addEventListener('online', refreshSyncPills);
  window.addEventListener('offline', refreshSyncPills);
  setInterval(refreshSyncPills, 30000);
  // Profile drawers are built during initial page load; avoid a document-wide observer here, because status text updates can retrigger it continuously.
})();
(function(){
  function done(){ var el=document.getElementById('maLoadingScreen'); if(el){ el.classList.add('done'); setTimeout(function(){ try{el.remove();}catch(e){} }, 450); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(done, 900); }); else setTimeout(done, 900);
  window.addEventListener('load', function(){ setTimeout(done, 400); });
  setTimeout(done, 2500);
})();

/* === mode-atlas-late-features.js === */
/* Shared late features: trainer runtime bindings and achievements. */

/* === Mode Atlas trainer/runtime feature bindings: modifiers, sessions, import preview, empty states === */
(function ModeAtlasTrainerRuntimeFeatures(){
  if (window.__modeAtlasTrainerRuntimeFeaturesLoaded) return;
  window.__modeAtlasTrainerRuntimeFeaturesLoaded = true;

  const PAGE = (window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase();
  const IS_TRAINER = PAGE === 'default.html' || PAGE === 'reverse.html';
  const IS_WRITING = PAGE === 'reverse.html';
  const SETTINGS_KEY = IS_WRITING ? 'reverseSettings' : 'settings';
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const readJSON = (k,f)=>{ try{ const raw=localStorage.getItem(k); return raw ? JSON.parse(raw) : f; } catch { return f; } };
  const writeJSON = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const now = ()=>Date.now();

  const HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'.split('');
  const KATA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフホマミムメモヤユヨラリルレロワヲン'.split('');
  const CONFUSABLE = ['シ','ツ','ソ','ン','ぬ','め','れ','わ','ね','ク','ケ','タ','ナ','メ'];
  const CONF_HIRA_ROWS = ['h_na','h_ma','h_ra','h_wa'];
  const CONF_KATA_ROWS = ['k_sa','k_ta','k_ka','k_na','k_ma','k_wa'];
  const HIRA_ROWS = ['h_a','h_ka','h_sa','h_ta','h_na','h_ha','h_ma','h_ya','h_ra','h_wa'];
  const KATA_ROWS = ['k_a','k_ka','k_sa','k_ta','k_na','k_ha','k_ma','k_ya','k_ra','k_wa'];

  function toast(message, type='info'){
    try { if (window.ModeAtlas?.toast) return window.ModeAtlas.toast(message, type, 2800); } catch {}
    let wrap = $('.ma-toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className='ma-toast-wrap'; document.body.appendChild(wrap); }
    const node = document.createElement('div');
    node.className = 'ma-toast ' + type;
    node.textContent = message;
    wrap.appendChild(node);
    setTimeout(()=>{ node.style.opacity='0'; setTimeout(()=>node.remove(),260); }, 2800);
  }

  function sectionTS(key){ try{ localStorage.setItem(key, String(now())); }catch{} }
  function trainerSettings(){
    let s = readJSON(SETTINGS_KEY, {});
    try { if (typeof settings === 'object' && settings) s = Object.assign({}, s, settings); } catch {}
    return s || {};
  }
  function persistTrainerSettings(next){
    try { if (typeof settings === 'object' && settings) Object.assign(settings, next); } catch {}
    writeJSON(SETTINGS_KEY, next);
    sectionTS('settingsUpdatedAt');
    try { window.KanaCloudSync?.markSectionUpdated?.(IS_WRITING ? 'writing' : 'reading'); window.KanaCloudSync?.scheduleSync?.(); } catch {}
  }
  function refreshTrainer(){
    try{ if (typeof rebuildCharMap === 'function') rebuildCharMap(); }catch{}
    try{ if (typeof ensureDataObjects === 'function') ensureDataObjects(); }catch{}
    try{ if (typeof buildModifierButtons === 'function') buildModifierButtons(); }catch{}
    try{ if (typeof buildRows === 'function' && typeof hiraganaRows === 'object') { buildRows('rowOptions', hiraganaRows, 'hiraganaRows', 'h_'); buildRows('katakanaRowOptions', katakanaRows, 'katakanaRows', 'k_'); } }catch{}
    try{ if (typeof updateTrialConfigVisibility === 'function') updateTrialConfigVisibility(); }catch{}
    try{ if (typeof updateTopStats === 'function') updateTopStats(); }catch{}
    try{ if (typeof renderHeatmap === 'function') renderHeatmap(); }catch{}
    try{ if (typeof renderScoreHistory === 'function') renderScoreHistory(); }catch{}
    try{ if (typeof saveAll === 'function') saveAll(); }catch{}
    try{ window.ModeAtlas?.refreshTrainerControls?.(); }catch{}
  }

  function makeBtn(label, active, onClick, disabled=false){
    const b=document.createElement('button');
    b.type='button';
    b.className='toggle-btn ma-structured-toggle' + (active?' active':'') + (disabled?' disabled':'');
    b.textContent=label;
    b.setAttribute('aria-pressed', active?'true':'false');
    b.disabled=!!disabled;
    b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); if(!disabled) onClick(); });
    return b;
  }

  function normalisePresetId(id){
    try{ return window.ModeAtlasPresets?.normaliseId?.(id) || String(id || '').trim().toLowerCase(); }catch{ return String(id || '').trim().toLowerCase(); }
  }
  function activePresetId(){
    try{
      const branch = IS_WRITING ? 'writing' : 'reading';
      return window.ModeAtlasPresets?.activePresetFor?.(branch) || '';
    }catch{
      return String(localStorage.getItem('modeAtlasActivePreset') || '').toLowerCase();
    }
  }
  function presetList(){
    const list = window.ModeAtlasPresets?.list;
    if(Array.isArray(list) && list.length) return list;
    return [
      {id:'starter', label:'Starter', desc:'A-row with hints'},
      {id:'intermediate', label:'Intermediate', desc:'All Hiragana, no hints'},
      {id:'advanced', label:'Advanced', desc:'Hiragana + Katakana + Dakuten'},
      {id:'pro', label:'Pro', desc:'Everything enabled'}
    ];
  }
  function makePresetBtn(preset, active){
    const id = normalisePresetId(preset && preset.id);
    const b = makeBtn('', active, ()=>{
      if(!id) return;
      const target = IS_WRITING ? 'writing' : 'reading';
      const applied = window.ModeAtlasPresets?.apply?.(id, { target, source: 'modifier-menu', notify: true });
      if(!applied){
        window.ModeAtlasTrainerControls?.applyPreset?.(id);
        return;
      }
      try{
        const current = readJSON(SETTINGS_KEY, {});
        if(typeof settings === 'object' && settings) Object.assign(settings, current);
      }catch{}
      refreshTrainer();
    });
    b.classList.add('ma-preset-toggle');
    b.dataset.preset = id;
    b.innerHTML = '<span>' + String(preset?.label || id) + '</span><small>' + String(preset?.desc || '') + '</small>';
    return b;
  }

  function modeToggle(key){
    let s = trainerSettings();
    if(key === 'speedRun'){
      s.speedRun = !s.speedRun;
      if(s.speedRun){ s.endless=false; s.timeTrial=false; s.dailyChallenge=false; s.testMode=false; s.comboKana=false; }
    } else if (key === 'timeTrial') {
      s.timeTrial = !s.timeTrial;
      if(s.timeTrial){ s.endless=false; s.dailyChallenge=false; s.testMode=false; s.speedRun=false; }
    } else if (key === 'endless') {
      s.endless = !s.endless;
      if(s.endless){ s.timeTrial=false; s.dailyChallenge=false; s.testMode=false; s.speedRun=false; }
    } else if (key === 'dailyChallenge') {
      s.dailyChallenge = !s.dailyChallenge;
      if(s.dailyChallenge){ s.timeTrial=false; s.endless=false; s.testMode=false; s.comboKana=false; s.speedRun=false; s.hint=false; }
    } else if (key === 'testMode') {
      s.testMode = !s.testMode;
      if(s.testMode){ s.timeTrial=false; s.endless=false; s.dailyChallenge=false; s.comboKana=false; s.speedRun=false; s.hint=false; }
    } else if (key === 'comboKana') {
      s.comboKana = !s.comboKana;
      if(s.comboKana){ s.dailyChallenge=false; s.testMode=false; s.speedRun=false; }
    } else if (key === 'confusableKana') {
      s.confusableKana = !s.confusableKana;
      if(s.confusableKana){
        s.hiraganaRows = CONF_HIRA_ROWS.slice();
        s.katakanaRows = CONF_KATA_ROWS.slice();
        s.dakuten=false; s.yoon=false; s.extendedKatakana=false;
        s.dailyChallenge=false; s.testMode=false; s.comboKana=false;
      }
    } else {
      s[key] = !s[key];
    }
    localStorage.removeItem('modeAtlasActivePreset');
    persistTrainerSettings(s);
    refreshTrainer();
  }

  function installStructuredModifierMenu(){
    if(!IS_TRAINER) return;
    const content=$('#modifiersContent'); const stack=$('.options-stack', content); const mod=$('#modifierOptions');
    if(!content || !stack || !mod) return;
    const old=window.buildModifierButtons || (typeof buildModifierButtons === 'function' ? buildModifierButtons : null);

    window.buildModifierButtons = buildModifierButtons = function(){
      const s=trainerSettings();
      const activePreset = activePresetId();
      const groups=[
        ['Study presets', presetList().map(p => Object.assign({ type:'preset' }, p))],
        ['Question flow', [
          ['srs','SRS'], ['endless','Endless'], ['timeTrial','Time Trial'], ['speedRun','Speed Run'], ['dailyChallenge','Daily Challenge'], ['testMode','Test Mode']
        ]],
        ['Practice focus', [
          ['hint','Hint Mode'], ['comboKana','Combo Kana'], ['focusWeak','Focus Weak'], ['confusableKana','Confusable Kana']
        ]],
        ['Content modifiers', [
          ['dakuten','Dakuten'], ['yoon','Yōon'], ['extendedKatakana','Extended Katakana']
        ]]
      ];
      mod.innerHTML='';
      mod.classList.add('ma-structured-modifiers');
      groups.forEach(([title,items])=>{
        const section=document.createElement('div');
        section.className='ma-modifier-group';
        const head=document.createElement('div');
        head.className='ma-modifier-group-title';
        head.textContent=title;
        const grid=document.createElement('div');
        grid.className='ma-modifier-group-grid';
        items.forEach(item=>{
          if(item && item.type === 'preset') grid.appendChild(makePresetBtn(item, activePreset === normalisePresetId(item.id)));
          else { const [key,label] = item; grid.appendChild(makeBtn(label, !!s[key], ()=>modeToggle(key))); }
        });
        section.append(head,grid);
        mod.appendChild(section);
      });
      try{ window.ModeAtlas?.refreshTrainerControls?.(); }catch{}
    };

    try{ buildModifierButtons(); }catch{ if(old) old(); }
  }

  function currentWrongList(){
    try{
      const per = sessionStats?.perChar || {};
      return Object.entries(per).filter(([_,d])=>Number(d.wrong||0)>0).map(([ch])=>ch);
    }catch{return [];}
  }

  function installSessionUpgrades(){
    if(!IS_TRAINER) return;
    try{
      if(window.__maSessionUpgradesDone) return;
      window.__maSessionUpgradesDone=true;

      const originalNext = nextCharacter;
      const originalStart = startSession;
      const originalShowModal = showSessionModal;

      window.__maMistakeReview = {active:false, list:[], index:0};
      window.__maSpeedRunTarget = 20;

      nextCharacter = function(){
        const review=window.__maMistakeReview;
        const s=trainerSettings();
        if(review?.active){
          if(!sessionStarted) return;
          if(review.index >= review.list.length){
            review.active=false;
            endSession(true);
            return;
          }
          clearHint?.();
          closePopup?.();
          inputEl.value='';
          currentChar=review.list[review.index++];
          hiraganaEl.textContent=currentChar;
          hiraganaEl.classList.remove('flash-correct','flash-wrong');
          charStartTime=Date.now();
          gameOverTitleEl.textContent='Wrong';
          gameOverAnswerEl.textContent='';
          inputEl.disabled=false;
          inputEl.focus();
          return;
        }
        if(s.speedRun && sessionStarted && sessionStats && sessionStats.answered >= window.__maSpeedRunTarget){
          endSession(true);
          return;
        }
        return originalNext.apply(this, arguments);
      };

      startSession = function(){
        const s=trainerSettings();
        if(s.speedRun){
          const next=Object.assign({}, s, {endless:true,timeTrial:false,dailyChallenge:false,testMode:false,comboKana:false});
          persistTrainerSettings(next);
        }
        return originalStart.apply(this, arguments);
      };
      if(startBtn){
        startBtn.replaceWith(startBtn.cloneNode(true));
        const newStart=$('#startBtn');
        if(newStart) newStart.addEventListener('click', startSession);
      }

      showSessionModal = function(autoEnded=false){
        originalShowModal.call(this, autoEnded);
        renderSessionActions(autoEnded);
      };

      function renderSessionActions(autoEnded){
        const actions = sessionModalBackdrop?.querySelector('.modal-actions');
        if(!actions) return;
        let enhanced = $('#maSessionActionPanel', actions);
        if(!enhanced){
          enhanced=document.createElement('div');
          enhanced.id='maSessionActionPanel';
          enhanced.className='ma-session-actions-pro';
          actions.insertBefore(enhanced, actions.firstChild);
        }
        const wrong=currentWrongList();
        const title = trainerSettings().speedRun ? 'Speed run complete' : (autoEnded ? 'Session complete' : 'Session ended');
        enhanced.innerHTML = `
          <div class="ma-session-summary">
            <strong>${title}</strong>
            <span>${wrong.length ? `${wrong.length} kana to review from this session.` : 'No mistakes to review from this session.'}</span>
          </div>
          <div class="ma-session-action-grid">
            <button type="button" data-ma-try-again>Try again</button>
            <button type="button" data-ma-review-mistakes ${wrong.length?'':'disabled'}>Review mistakes</button>
            <button type="button" data-ma-change-settings>Change settings</button>
            <button type="button" data-ma-view-results>View results</button>
          </div>`;
      }

      document.addEventListener('click', e=>{
        if(e.target.closest?.('[data-ma-try-again]')){
          e.preventDefault(); sessionModalBackdrop.classList.remove('open'); window.__maMistakeReview.active=false; startSession();
        }
        if(e.target.closest?.('[data-ma-review-mistakes]')){
          e.preventDefault();
          const wrong=currentWrongList();
          if(!wrong.length) return;
          sessionModalBackdrop.classList.remove('open');
          window.__maMistakeReview={active:true,list:wrong.slice(),index:0};
          const s=Object.assign({}, trainerSettings(), {endless:true,timeTrial:false,dailyChallenge:false,testMode:false,comboKana:false,speedRun:false});
          persistTrainerSettings(s);
          startSession();
          toast('Mistake review started.', 'ok');
        }
        if(e.target.closest?.('[data-ma-change-settings]')){
          e.preventDefault(); sessionModalBackdrop.classList.remove('open'); 
          const s=Object.assign({}, trainerSettings(), {activeBottomTab:'modifiers'});
          persistTrainerSettings(s); refreshTrainer();
        }
        if(e.target.closest?.('[data-ma-view-results]')){
          e.preventDefault(); location.href='/results/';
        }
      }, true);
    }catch(err){ console.warn('Session upgrade install failed', err); }
  }

  function saveKeyStatsForPreset(){
    // Track preset achievement from accumulated Reading + Writing character correctness.
    const readingStats = readJSON('charStats',{});
    const writingStats = readJSON('reverseCharStats',{});
    const correctForChar = ch => Number((readingStats[ch]||{}).correct || (readingStats[ch]||{}).right || 0) + Number((writingStats[ch]||{}).correct || (writingStats[ch]||{}).right || 0);
    const countFor = chars => chars.reduce((sum,ch)=>sum + correctForChar(ch), 0);
    return {
      starter: Math.min(100, countFor('あいうえお'.split(''))),
      intermediate: Math.min(100, countFor(HIRA)),
      advanced: Math.min(100, countFor([...HIRA,...KATA])),
      pro: Math.min(100, countFor([...HIRA,...KATA, ...CONFUSABLE]))
    };
  }

  function installPresetChecklist(){
    if(PAGE !== 'kana.html') return;
    const anchor = $('#maPresetChecklist') || $('.ma-kana-pro-card') || $('main') || document.body;
    let panel=$('#maPresetChecklist');
    if(!panel){
      panel=document.createElement('section');
      panel.id='maPresetChecklist';
      panel.className='ma-kana-pro-card ma-preset-checklist';
      anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    }
    const progress=saveKeyStatsForPreset();
    const defs=[
      ['starter','Starter','A-row with hints'],
      ['intermediate','Intermediate','All Hiragana, no hints'],
      ['advanced','Advanced','Hiragana + Katakana + Dakuten'],
      ['pro','Pro','Everything enabled']
    ];
    panel.innerHTML=`
      <div class="ma-kana-pro-head">
        <div>
          <h2 class="ma-kana-pro-title">Preset achievements</h2>
          <div class="ma-kana-pro-sub">Get 100 correct answers over time in each preset. Nothing is locked — this is just a progress tracker.</div>
        </div>
      </div>
      <div class="ma-achievement-grid">
        ${defs.map(([id,title,desc])=>{
          const n=progress[id]||0; const done=n>=100;
          return `<article class="ma-achievement-card ${done?'done':''}">
            <div class="ma-achievement-top"><b>${title}</b><span>${n}/100</span></div>
            <small>${desc}</small>
            <div class="ma-progress-track"><span style="width:${Math.min(100,n)}%"></span></div>
            <em>${done?'Complete':'In progress'}</em>
          </article>`;
        }).join('')}
      </div>`;
  }

  function installNoDataStates(){
    if(PAGE === 'test.html'){
      const run=()=>{
        const possibleLists=['testModeResults','readingTestModeResults','writingTestModeResults','kanaTrainerReadingTestModeResults','kanaTrainerWritingTestModeResults'];
        const has=possibleLists.some(k=>Array.isArray(readJSON(k,null)) && readJSON(k,[]).length);
        if(has) return;
        if($('#maNoDataResults')) return;
        const target=$('.stored-tests, #storedTests, .results-list, main') || document.body;
        const box=document.createElement('section');
        box.id='maNoDataResults';
        box.className='ma-no-data-card';
        box.innerHTML='<h2>No formal test results yet</h2><p>Complete a Reading or Writing Test Mode run to unlock detailed score cards, speed trends, and weak-kana breakdowns.</p><div class="ma-no-data-actions"><a href="/reading/">Start Reading Test</a><a href="/writing/">Start Writing Test</a></div>';
        target.parentNode.insertBefore(box, target);
      };
      setTimeout(run,600); setTimeout(run,1800);
    }
    if(PAGE === 'kana.html'){
      const hasStats=Object.keys(readJSON('charStats',{})).length || Object.keys(readJSON('reverseCharStats',{})).length;
      if(!hasStats && !$('#maNoDataKana')){
        const main=$('main')||document.body;
        const box=document.createElement('section');
        box.id='maNoDataKana';
        box.className='ma-no-data-card ma-no-data-kana';
        box.innerHTML='<h2>Your Kana dashboard is ready</h2><p>Complete a few Reading or Writing sessions to fill this hub with streaks, mastery labels, speed goals, and review suggestions.</p>';
        main.appendChild(box);
      }
    }
  }

  function installImportPreview(){
    // Native trainer import modal uses the same in-app confirmation and
    // canonical importer as the profile drawer file-import flow.
    document.addEventListener('click', e=>{
      const btn=e.target.closest?.('#confirmImportBtn');
      if(!btn) return;
      const txt=$('#importTextarea');
      if(!txt) return;
      const raw=txt.value.trim();
      if(!raw) return;
      e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
      try{
        const payload=JSON.parse(raw);
        if(window.ModeAtlasImportUi?.previewAndImport){
          window.ModeAtlasImportUi.previewAndImport(payload, {
            afterImport: ()=>{
              try{ $('#importModalBackdrop')?.classList.remove('open'); }catch{}
              location.reload();
            }
          }).catch(err=>{
            console.warn('Save import failed.', err);
            toast('Import failed. Please use a valid Mode Atlas save file.', 'bad');
          });
        } else if(window.KanaCloudSync?.importLocalBackup){
          window.KanaCloudSync.importLocalBackup(payload).then(()=>location.reload()).catch(err=>{
            console.warn('Save import failed.', err);
            toast('Import failed. Please use a valid Mode Atlas save file.', 'bad');
          });
        }
      }catch{
        toast('Import failed. Make sure the JSON is valid.', 'bad');
      }
    }, true);
  }

  function boot(){
    installStructuredModifierMenu();
    try{ window.ModeAtlasTrainerControls?.refresh?.(); }catch{}
    installSessionUpgrades();
    installPresetChecklist();
    installNoDataStates();
    installImportPreview();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('pageshow', ()=>setTimeout(boot,100));
})();
(function(){
  'use strict';
  const VERSION = (window.ModeAtlasEnv && window.ModeAtlasEnv.appVersion) || window.ModeAtlasVersion || 'dev-local';
  const HIRA = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん'];
  const KATA = ['ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ','マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ヲ','ン'];
  const DAK = ['が','ぎ','ぐ','げ','ご','ざ','じ','ず','ぜ','ぞ','だ','ぢ','づ','で','ど','ば','び','ぶ','べ','ぼ','ぱ','ぴ','ぷ','ぺ','ぽ','ガ','ギ','グ','ゲ','ゴ','ザ','ジ','ズ','ゼ','ゾ','ダ','ヂ','ヅ','デ','ド','バ','ビ','ブ','ベ','ボ','パ','ピ','プ','ペ','ポ'];
  const YOON = ['きゃ','きゅ','きょ','しゃ','しゅ','しょ','ちゃ','ちゅ','ちょ','にゃ','にゅ','にょ','ひゃ','ひゅ','ひょ','みゃ','みゅ','みょ','りゃ','りゅ','りょ','ぎゃ','ぎゅ','ぎょ','じゃ','じゅ','じょ','びゃ','びゅ','びょ','ぴゃ','ぴゅ','ぴょ','キャ','キュ','キョ','シャ','シュ','ショ','チャ','チュ','チョ','ニャ','ニュ','ニョ','ヒャ','ヒュ','ヒョ','ミャ','ミュ','ミョ','リャ','リュ','リョ'];
  const EXT = ['ファ','フィ','フェ','フォ','ヴァ','ヴィ','ヴ','ヴェ','ヴォ','ティ','ディ','チェ','ジェ','シェ','ウィ','ウェ','ウォ'];
  const ALL = [...new Set([...HIRA,...KATA,...DAK,...YOON,...EXT])];
  let ACH_INDEX = {};
  function readJSON(k, fallback){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fallback; }catch(e){ return fallback; } }
  function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function clamp(n){return Math.round(Math.max(0, Math.min(100, Number(n)||0)));}
  function latestTimestamp(keys){ let best=0; keys.forEach(k=>{ const v=localStorage.getItem(k); const t=v?Date.parse(v):0; if(t>best) best=t; }); return best; }
  function countStats(){
    const r=readJSON('charStats',{}), w=readJSON('reverseCharStats',{}), times=readJSON('charTimes',{}), words=readJSON('kanaWordBank',[]), tests=readJSON('testModeResults',[]);
    let correct=0, wrong=0, mastered=0, reviewing=0, learning=0, seen=new Set(), under2=0, under1=0, perfect=0, avgSum=0, avgCount=0;
    [r,w].forEach(obj=>Object.keys(obj||{}).forEach(ch=>{ const s=obj[ch]||{}; const c=+s.correct||0, x=+s.wrong||0; if(c+x>0) seen.add(ch); correct+=c; wrong+=x; }));
    ALL.forEach(ch=>{
      const rs=(r&&r[ch])||{}, ws=(w&&w[ch])||{}; const c=(+rs.correct||0)+(+ws.correct||0), x=(+rs.wrong||0)+(+ws.wrong||0); const total=c+x;
      const raw=(times&&times[ch]&&times[ch].avg)||0; const avg=raw>30 ? raw/1000 : raw;
      if(total===0) return;
      if(avg){ avgSum+=avg; avgCount++; }
      if(c>=20 && c/Math.max(1,total)>=0.9 && (!avg || avg<=2)) mastered++;
      else if(total>=8 && c/Math.max(1,total)>=0.7) reviewing++;
      else learning++;
      if(avg && avg<=2) under2++;
      if(avg && avg<=1) under1++;
    });
    const wordCount = Array.isArray(words) ? words.length : (words&&typeof words==='object'?Object.keys(words).length:0);
    const resultCount = Array.isArray(tests) ? tests.length : 0;
    try { perfect = (Array.isArray(tests)?tests:[]).filter(t=>Number(t.accuracy||0)>=100 || (Number(t.wrong||t.incorrect||0)===0 && Number(t.correct||0)>0)).length; } catch {}
    const cloud = localStorage.getItem('modeAtlasLastCloudSyncAt') ? 1 : 0;
    const backup = localStorage.getItem('modeAtlasLastExportAt') || localStorage.getItem('modeAtlasLastBackupAt') ? 1 : 0;
    const recentSave = latestTimestamp(['settingsUpdatedAt','resultsUpdatedAt','srsUpdatedAt','dailyUpdatedAt','profileUpdatedAt','kanaWordBankUpdatedAt']);
    return {correct,wrong,total:correct+wrong,seen:seen.size,mastered,reviewing,learning,under2,under1,wordCount,resultCount,perfect,cloud,backup,recentSave,avg:avgCount?avgSum/avgCount:0};
  }
  const DEFINITIONS = {
    general: [
      {name:'First Steps', tier:'I', short:'25 answers', detail:'Answer 25 questions anywhere in Mode Atlas. Reading, Writing, Tests, and future branches all count.', target:25, key:'total'},
      {name:'Study Rhythm', tier:'I', short:'250 answers', detail:'Answer 250 total questions. This rewards steady practice across the app.', target:250, key:'total'},
      {name:'Study Rhythm', tier:'II', short:'1,000 answers', detail:'Answer 1,000 total questions across Mode Atlas.', target:1000, key:'total'},
      {name:'Study Rhythm', tier:'III', short:'2,500 answers', detail:'Answer 2,500 total questions across Mode Atlas.', target:2500, key:'total'},
      {name:'Study Rhythm', tier:'IV', short:'5,000 answers', detail:'Answer 5,000 total questions. This is for long-term consistency.', target:5000, key:'total'},
      {name:'Cloud Ready', tier:'Sync', short:'Cloud synced', detail:'Sign in and complete at least one successful cloud save so progress can follow you across devices.', target:1, key:'cloud'},
      {name:'Safety Net', tier:'Backup', short:'Export backup', detail:'Export or copy a save backup at least once. Backups help protect progress before big app updates.', target:1, key:'backup'}
    ],
    kana: [
      {name:'Kana Started', tier:'I', short:'25 kana seen', detail:'Practise at least 25 unique kana in Reading or Writing.', target:25, key:'seen'},
      {name:'Kana Collector', tier:'I', short:'75 kana seen', detail:'Practise at least 75 unique kana in the Kana Trainer.', target:75, key:'seen'},
      {name:'Kana Collector', tier:'II', short:'125 kana seen', detail:'Practise at least 125 unique kana across the trainer.', target:125, key:'seen'},
      {name:'Kana Collector', tier:'III', short:'175 kana seen', detail:'Practise 175 unique kana, covering most of the app’s kana set.', target:175, key:'seen'},
      {name:'Speed Goal', tier:'I', short:'25 under 2.0s', detail:'Build timing history until 25 kana average under 2.0 seconds.', target:25, key:'under2'},
      {name:'Speed Goal', tier:'II', short:'50 under 2.0s', detail:'Reach the 2.0 second recognition goal on 50 kana.', target:50, key:'under2'},
      {name:'Speed Goal', tier:'III', short:'100 under 2.0s', detail:'Reach the 2.0 second recognition goal on 100 kana.', target:100, key:'under2'},
      {name:'Fluent Target', tier:'I', short:'10 under 1.0s', detail:'Build timing history until 10 kana average under 1.0 second.', target:10, key:'under1'},
      {name:'Fluent Target', tier:'II', short:'25 under 1.0s', detail:'Reach fluent-speed timing on 25 kana. This is the second tier after the first fluent target.', target:25, key:'under1'},
      {name:'Fluent Target', tier:'III', short:'50 under 1.0s', detail:'Reach fluent-speed timing on 50 kana. This is a strong recognition milestone.', target:50, key:'under1'},
      {name:'Mastery Path', tier:'I', short:'20 mastered', detail:'Reach Mastered on 20 kana. Mastered combines attempts, accuracy, and speed.', target:20, key:'mastered'},
      {name:'Mastery Path', tier:'II', short:'50 mastered', detail:'Reach Mastered on 50 kana.', target:50, key:'mastered'},
      {name:'Mastery Path', tier:'III', short:'100 mastered', detail:'Reach Mastered on 100 kana.', target:100, key:'mastered'},
      {name:'Test Taker', tier:'I', short:'1 formal test', detail:'Complete your first formal Kana Trainer test.', target:1, key:'resultCount'},
      {name:'Test Taker', tier:'II', short:'10 formal tests', detail:'Complete 10 formal Kana Trainer tests.', target:10, key:'resultCount'},
      {name:'Perfect Form', tier:'I', short:'1 perfect test', detail:'Complete a formal test with no mistakes.', target:1, key:'perfect'},
      {name:'Perfect Form', tier:'II', short:'5 perfect tests', detail:'Complete five formal tests with no mistakes.', target:5, key:'perfect'}
    ],
    wordbank: [
      {name:'First Saved Word', tier:'I', short:'1 word', detail:'Save your first word in Word Bank.', target:1, key:'wordCount'},
      {name:'Word Stash', tier:'I', short:'25 words', detail:'Save 25 words in Word Bank.', target:25, key:'wordCount'},
      {name:'Word Stash', tier:'II', short:'100 words', detail:'Save 100 words in Word Bank.', target:100, key:'wordCount'},
      {name:'Word Archive', tier:'I', short:'250 words', detail:'Save 250 words in Word Bank.', target:250, key:'wordCount'},
      {name:'Word Archive', tier:'II', short:'500 words', detail:'Save 500 words in Word Bank.', target:500, key:'wordCount'}
    ]
  };
  function valueFor(s,key){ return Number(s[key]||0); }
  function achievementVisual(item,branch){
    const name=String(item&&item.name||'').toLowerCase();
    const out={
      branchLabel: branch==='kana' ? 'Kana Trainer' : branch==='wordbank' ? 'Word Bank' : 'General',
      accent: branch==='kana' ? '80,220,155' : branch==='wordbank' ? '96,165,250' : '245,195,93',
      icon: branch==='kana' ? 'あ' : branch==='wordbank' ? '語' : '✦'
    };
    if(branch==='general'){
      if(name.includes('rhythm')) out.icon='◎';
      else if(name.includes('cloud')) out.icon='☁';
      else if(name.includes('safety')) out.icon='⟲';
      else if(name.includes('first')) out.icon='✦';
    }
    if(branch==='kana'){
      if(name.includes('collector')) out.icon='カ';
      else if(name.includes('speed')) out.icon='速';
      else if(name.includes('fluent')) out.icon='流';
      else if(name.includes('mastery')) out.icon='達';
      else if(name.includes('test')) out.icon='試';
      else if(name.includes('perfect')) out.icon='✓';
    }
    if(branch==='wordbank'){
      if(name.includes('first')) out.icon='初';
      else if(name.includes('stash')) out.icon='帳';
      else if(name.includes('archive')) out.icon='保';
    }
    return out;
  }
  function achievement(item,s,branch,index){
    const value=valueFor(s,item.key), done=value>=item.target, pct=clamp(item.target ? value/item.target*100 : 0);
    const id=branch+'-'+index;
    const visual=achievementVisual(item,branch);
    ACH_INDEX[id]={...item, ...visual, value, pct, done, branch};
    return `<button type="button" class="ma-achievement-tile branch-${esc(branch)} ${done?'done':''}" style="--ma-ach-accent:${visual.accent};" data-ma-ach-id="${esc(id)}" aria-label="${esc(item.name+' '+item.tier)} achievement details">
      <div class="ma-ach-topline"><span class="ma-ach-status-text">${done?'Unlocked':pct+'%'}</span></div>
      <span class="ma-ach-graphic" aria-hidden="true">${esc(visual.icon)}</span>
      <strong>${esc(item.name)}</strong>
      <em>${esc(item.tier)}</em>
      <small>${esc(item.short)}</small>
      <div class="ma-ach-meter" aria-hidden="true"><span class="ma-ach-meter-fill" style="width:${pct}%"></span><span class="ma-ach-meter-label">${pct}%</span></div>
    </button>`;
  }
  function branchSection(title,key,s){
    const list=DEFINITIONS[key]||[];
    const unlocked=list.filter(item=>valueFor(s,item.key)>=item.target).length;
    return `<section class="ma-achievement-section"><div class="ma-ach-section-head"><h3>${esc(title)}</h3><span>${unlocked}/${list.length} unlocked</span></div><div class="ma-achievement-grid">${list.map((x,i)=>achievement(x,s,key,i)).join('')}</div></section>`;
  }
  function currentUnlockedAchievements(){
    const s=countStats();
    const out=[];
    Object.keys(DEFINITIONS).forEach(branch=>{
      (DEFINITIONS[branch]||[]).forEach((item,index)=>{
        if(valueFor(s,item.key)>=item.target){
          out.push({id:branch+'-'+index, branch, index, name:item.name, tier:item.tier});
        }
      });
    });
    return out;
  }
  function getSeenAchievementSet(){
    try { return new Set(JSON.parse(localStorage.getItem('modeAtlasSeenAchievementUnlocks')||'[]')); }
    catch(e){ return new Set(); }
  }
  function saveSeenAchievementSet(set){
    try { localStorage.setItem('modeAtlasSeenAchievementUnlocks', JSON.stringify([...set])); } catch(e){}
  }
  function achievementToast(message){
    try { if(window.ModeAtlas && typeof window.ModeAtlas.toast==='function') return window.ModeAtlas.toast(message,'ok',4200); } catch(e){}
    let wrap=document.querySelector('.ma-toast-wrap');
    if(!wrap){ wrap=document.createElement('div'); wrap.className='ma-toast-wrap'; document.body.appendChild(wrap); }
    const node=document.createElement('div'); node.className='ma-toast ok'; node.textContent=message; wrap.appendChild(node);
    setTimeout(()=>{ node.style.opacity='0'; node.style.transform='translateY(-6px)'; setTimeout(()=>node.remove(),350); },4200);
  }
  function checkAchievementUnlocks({silent=false}={}){
    const unlocked=currentUnlockedAchievements();
    let seen=getSeenAchievementSet();
    if(!localStorage.getItem('modeAtlasAchievementBaselineSet')){
      unlocked.forEach(a=>seen.add(a.id));
      saveSeenAchievementSet(seen);
      try { localStorage.setItem('modeAtlasAchievementBaselineSet','1'); } catch(e){}
      return [];
    }
    const fresh=unlocked.filter(a=>!seen.has(a.id));
    if(fresh.length){
      fresh.forEach(a=>seen.add(a.id));
      saveSeenAchievementSet(seen);
      if(!silent){
        const first=fresh[0];
        const suffix=fresh.length>1 ? ` +${fresh.length-1} more` : '';
        achievementToast(`Achievement unlocked: ${first.name} ${first.tier}${suffix}`);
      }
    }
    return fresh;
  }
  function startAchievementWatcher(){
    if(window.__maAchievementWatcherStarted) return;
    window.__maAchievementWatcherStarted=true;
    checkAchievementUnlocks({silent:true});
    setInterval(()=>checkAchievementUnlocks(),2500);
    window.addEventListener('storage',e=>{
      if(e && e.key && /charStats|reverseCharStats|charTimes|testModeResults|kanaWordBank|modeAtlasLastCloudSyncAt|modeAtlasLastExportAt|modeAtlasLastBackupAt/.test(e.key)) checkAchievementUnlocks();
    });
    document.addEventListener('ma:progress-updated',()=>checkAchievementUnlocks());
  }
  function renderAchievements(){
    const s=countStats(); ACH_INDEX={};
    const totalDefs=[...DEFINITIONS.general,...DEFINITIONS.kana,...DEFINITIONS.wordbank];
    const unlocked=totalDefs.filter(item=>valueFor(s,item.key)>=item.target).length;
    return `<div class="ma-modal-head"><div><h2>Achievements</h2><p>Milestones across Mode Atlas. Select a tile to see the full unlock requirement.</p></div><button type="button" data-ma-modal-close>Close</button></div>
    <div class="ma-ach-overview"><div><b>${unlocked}</b><span>Unlocked</span></div><div><b>${totalDefs.length}</b><span>Total</span></div><div><b>${clamp(unlocked/Math.max(1,totalDefs.length)*100)}%</b><span>Complete</span></div></div>
    <div class="ma-achievement-layout">${branchSection('General','general',s)}${branchSection('Kana Trainer','kana',s)}${branchSection('Word Bank','wordbank',s)}</div>`;
  }
  function openAchievementInfo(id){
    const item=ACH_INDEX[id]; if(!item) return;
    let pop=document.getElementById('maAchievementInfo');
    if(!pop){
      pop=document.createElement('div'); pop.id='maAchievementInfo'; pop.className='ma-ach-info';
      pop.innerHTML='<div class="ma-ach-info-backdrop" data-ma-ach-info-close></div><div class="ma-ach-info-panel" role="dialog" aria-modal="true"><button type="button" class="ma-ach-info-close" data-ma-ach-info-close>Close</button><div class="ma-ach-info-body"></div></div>';
      document.body.appendChild(pop);
      pop.addEventListener('click',e=>{ if(e.target.closest('[data-ma-ach-info-close]')) pop.classList.remove('open'); });
    }
    pop.querySelector('.ma-ach-info-body').innerHTML=`<div class="ma-ach-info-topbar"><div class="ma-ach-info-hero branch-${esc(item.branch)} ${item.done?'done':''}" style="--ma-ach-accent:${item.accent||'96,165,250'};"><span class="ma-ach-info-symbol" aria-hidden="true">${esc(item.icon||'✦')}</span><div><span class="ma-ach-info-kicker">${esc(item.branchLabel||item.branch.replace(/^./,c=>c.toUpperCase()))}</span><h3>${esc(item.name)} <em>${esc(item.tier)}</em></h3></div></div><button type="button" class="ma-ach-info-close-inline" data-ma-ach-info-close>Close</button></div><p class="ma-ach-info-copy">${esc(item.detail)}</p><div class="ma-ach-info-progress"><div class="ma-ach-info-progress-row"><strong>${item.done?'Unlocked':'In progress'}</strong><span>${Math.min(item.value,item.target)} / ${item.target}</span></div><i><b style="width:${item.pct}%"></b></i></div>`;
    pop.classList.add('open');
  }
  function masteryLabel(ch){
    const r=readJSON('charStats',{}), w=readJSON('reverseCharStats',{}), times=readJSON('charTimes',{});
    const rs=(r&&r[ch])||{}, ws=(w&&w[ch])||{}; const c=(+rs.correct||0)+(+ws.correct||0), x=(+rs.wrong||0)+(+ws.wrong||0); const total=c+x; const raw=(times&&times[ch]&&times[ch].avg)||0; const avg=raw>30?raw/1000:raw;
    if(total===0) return {label:'New', cls:'new', detail:'Not practised yet'};
    if(c>=20 && c/Math.max(1,total)>=0.9 && (!avg || avg<=2)) return {label:'Mastered', cls:'mastered', detail:`${c}/${total} correct${avg?' · '+avg.toFixed(1)+'s':''}`};
    if(total>=8 && c/Math.max(1,total)>=0.7) return {label:'Reviewing', cls:'reviewing', detail:`${c}/${total} correct${avg?' · '+avg.toFixed(1)+'s':''}`};
    return {label:'Learning', cls:'learning', detail:`${c}/${total} correct${avg?' · '+avg.toFixed(1)+'s':''}`};
  }
  function grid(title, chars){
    return `<section class="ma-mastery-group"><h3>${esc(title)}</h3><div class="ma-mastery-grid">${chars.map(ch=>{const m=masteryLabel(ch); return `<button type="button" class="ma-mastery-cell ${m.cls}" title="${esc(ch)} · ${esc(m.label)} · ${esc(m.detail)}"><strong>${esc(ch)}</strong><span>${esc(m.label)}</span></button>`;}).join('')}</div></section>`;
  }
  function renderMasteryMap(){
    const s=countStats();
    return `<div class="ma-modal-head"><div><h2>Mastery Map</h2><p>A full kana grid showing accuracy, repetition, and speed progress.</p></div><button type="button" data-ma-modal-close>Close</button></div>
    <div class="ma-mastery-legend">
      <div><b>New</b><span>You have not practised this kana yet.</span></div>
      <div><b>Learning</b><span>You have started it, but accuracy or attempts are still low.</span></div>
      <div><b>Reviewing</b><span>You are mostly correct, but it needs more reliable reps before mastery.</span></div>
      <div><b>Mastered</b><span>20+ correct, 90%+ accuracy, and around the 2.0s recognition goal.</span></div>
    </div>
    <div class="ma-mastery-summary"><span><b>${s.mastered}</b> mastered</span><span><b>${s.reviewing}</b> reviewing</span><span><b>${s.learning}</b> learning</span><span><b>${s.under2}</b> under 2.0s</span><span><b>${s.under1}</b> under 1.0s</span></div>
    ${grid('Hiragana',HIRA)}${grid('Katakana',KATA)}${grid('Dakuten',DAK)}${grid('Yōon',YOON)}${grid('Extended Katakana',EXT)}`;
  }
  function openModal(kind){
    let shell=document.getElementById('maFeatureModal');
    if(!shell){
      shell=document.createElement('div'); shell.id='maFeatureModal'; shell.className='ma-feature-modal';
      shell.innerHTML='<div class="ma-feature-backdrop" data-ma-modal-close></div><div class="ma-feature-panel" role="dialog" aria-modal="true"><div class="ma-feature-content"></div></div>';
      document.body.appendChild(shell);
      shell.addEventListener('click',e=>{
        if(e.target.closest('[data-ma-modal-close]')) closeModal();
        const ach=e.target.closest('[data-ma-ach-id]');
        if(ach){ e.preventDefault(); openAchievementInfo(ach.getAttribute('data-ma-ach-id')); }
      });
      document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeModal(); const p=document.getElementById('maAchievementInfo'); if(p) p.classList.remove('open'); }});
    }
    shell.querySelector('.ma-feature-content').innerHTML = kind==='mastery' ? renderMasteryMap() : renderAchievements();
    shell.classList.add('open');
  }
  function closeModal(){ const shell=document.getElementById('maFeatureModal'); if(shell) shell.classList.remove('open'); const p=document.getElementById('maAchievementInfo'); if(p) p.classList.remove('open'); }
  function cleanProfileButtons(){
    document.querySelectorAll('.ma-shared-profile-drawer').forEach(drawer=>{
      const buttons=[...drawer.querySelectorAll('[data-ma-achievements-open]')];
      const keep=buttons.find(btn=>btn.closest('.ma-achievement-card-summary')) || buttons[0];
      buttons.forEach(btn=>{ if(btn!==keep) btn.remove(); });
    });
  }
  function injectMasteryButton(){
    document.querySelectorAll('[data-ma-mastery-open]').forEach(btn=>{ if((window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase()!=='kana.html') btn.remove(); });
    const page=(window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase();
    if(page!=='kana.html') return;
    if(document.querySelector('[data-ma-mastery-open]')) return;
    const panel=document.getElementById('maSpeedMasteryPanel');
    if(!panel) return;
    const head=panel.querySelector('.ma-kana-pro-head') || panel;
    const btn=document.createElement('button'); btn.type='button'; btn.className='ma-mastery-open-btn'; btn.dataset.maMasteryOpen='1'; btn.textContent='Open Mastery Map'; btn.addEventListener('click',()=>openModal('mastery'));
    head.appendChild(btn);
  }
  function init(){ cleanProfileButtons(); injectMasteryButton(); startAchievementWatcher(); if(!window.__maFeatureClickBound){ window.__maFeatureClickBound=true; document.addEventListener('click',e=>{ if(e.target.closest('[data-ma-achievements-open]')) openModal('achievements'); if(e.target.closest('[data-ma-mastery-open]')) openModal('mastery'); }); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  setTimeout(init,800); setTimeout(init,2000);
  window.ModeAtlasFeatures={openAchievements:()=>openModal('achievements'), openMasteryMap:()=>openModal('mastery'), checkAchievements:()=>checkAchievementUnlocks(), version:VERSION};
})();

/* === mode-atlas-late-auth.js === */
/* Shared late auth runtime. */
(function ModeAtlasAuthMobileFix(){
  // Deprecated: replaced by mode-atlas-auth-single-button.js.
  // Intentionally left as a no-op so old HTML script tags cannot create duplicate auth controls or mutation loops.
  window.__modeAtlasAuthMobileFixLoaded = true;
})();
(function ModeAtlasSingleAuthButton(){
  if (window.__modeAtlasSingleAuthButtonLoaded) return;
  window.__modeAtlasSingleAuthButtonLoaded = true;

  const SIGN_IN_SELECTORS = '#profileSignInBtn,#studyProfileSignIn,#identitySignInBtn,[data-profile-sign-in],[data-ma-sign-in]';
  const SIGN_OUT_SELECTORS = '#profileSignOutBtn,#studyProfileSignOut,#identitySignOutBtn,[data-profile-sign-out],[data-ma-sign-out]';
  const DRAWER_SELECTORS = '.ma-shared-profile-drawer,#profileDrawer';

  function all(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
  function getUser(){ try { return window.KanaCloudSync && typeof window.KanaCloudSync.getUser === 'function' ? window.KanaCloudSync.getUser() : null; } catch { return null; } }
  function signedIn(){ return !!getUser(); }
  function text(el){ return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function isAuthText(el){ return /^(sign in(?: with google)?|log in|login|sign out|logout|log out)$/i.test(text(el)); }
  function findAuthButtons(root){
    const set = new Set();
    all(`${SIGN_IN_SELECTORS},${SIGN_OUT_SELECTORS},[data-ma-auth-main]`, root).forEach(el => set.add(el));
    all('button,a', root).filter(isAuthText).forEach(el => set.add(el));
    return Array.from(set);
  }
  function hide(el){
    if (!el) return;
    el.hidden = true;
    el.disabled = true;
    el.setAttribute('aria-hidden','true');
    el.setAttribute('tabindex','-1');
    el.style.setProperty('display','none','important');
    el.classList.add('ma-auth-removed');
    el.removeAttribute('data-ma-auth-main');
  }
  function showMain(btn){
    if (!btn) return;
    const isIn = signedIn();
    btn.hidden = false;
    btn.disabled = false;
    btn.removeAttribute('aria-hidden');
    btn.removeAttribute('tabindex');
    btn.style.setProperty('display','inline-flex','important');
    btn.classList.remove('ma-auth-removed');
    btn.setAttribute('data-ma-auth-main','');
    btn.removeAttribute('data-profile-sign-in');
    btn.removeAttribute('data-profile-sign-out');
    btn.removeAttribute('data-ma-sign-in');
    btn.removeAttribute('data-ma-sign-out');
    btn.textContent = isIn ? 'Sign out' : 'Sign in';
    btn.classList.toggle('ma-primary', !isIn);
  }
  function chooseMain(root, buttons){
    const existing = buttons.find(el => el.hasAttribute('data-ma-auth-main') && !el.classList.contains('ma-auth-removed'));
    if (existing) return existing;
    const signIn = buttons.find(el => /^(sign in(?: with google)?|log in|login)$/i.test(text(el)) && !el.classList.contains('ma-auth-removed'));
    if (signIn) return signIn;
    return buttons.find(el => !el.classList.contains('ma-auth-removed')) || null;
  }
  function syncOne(root){
    const buttons = findAuthButtons(root);
    if (!buttons.length) return;
    const main = chooseMain(root, buttons);
    buttons.forEach(el => { if (el !== main) hide(el); });
    showMain(main);
  }
  function sync(){
    const roots = all(DRAWER_SELECTORS).filter(Boolean);
    if (roots.length) roots.forEach(root => syncOne(root)); else syncOne(document);
    try {
      const user = getUser();
      const display = user && (user.displayName || (user.email || '').split('@')[0]);
      if (display) all('#profileName,#drawerName,#studyProfileName,#identityName').forEach(el => { el.textContent = display; });
      if (user && user.email) all('#profileEmail,#drawerEmail,#studyProfileEmail,#identityEmail').forEach(el => { el.textContent = user.email; });
    } catch {}
  }
  async function runAuthAction(){
    const cloud = window.KanaCloudSync;
    if (!cloud) return;
    try {
      if (signedIn()) await cloud.signOut?.();
      else await cloud.signInWithGoogle?.();
    } finally {
      setTimeout(sync, 80);
      setTimeout(sync, 600);
    }
  }
  document.addEventListener('click', function(e){
    const btn = e.target && e.target.closest && e.target.closest('[data-ma-auth-main]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation(); if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    runAuthAction();
  }, true);
  window.ModeAtlas = window.ModeAtlas || {};
  window.ModeAtlas.syncSingleAuthButton = sync;
  function boot(){
    sync();
    [100, 400, 1000, 2200].forEach(t => setTimeout(sync, t));
    setInterval(sync, 2500);
    window.addEventListener('kanaCloudSyncStatusChanged', sync);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    try {
      const mo = new MutationObserver(function(){
        if (window.__maAuthSyncQueued) return;
        window.__maAuthSyncQueued = true;
        setTimeout(function(){ window.__maAuthSyncQueued = false; sync(); }, 120);
      });
      mo.observe(document.body || document.documentElement, { childList:true, subtree:true });
    } catch {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
})();
