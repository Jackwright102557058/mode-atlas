/* Mode Atlas trainer modifier menu and trainer runtime bindings. Owns trainer modifier controls and session UI upgrades. */
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

  function makeBtn(label, active, key='', disabled=false){
    const b=document.createElement('button');
    b.type='button';
    b.className='toggle-btn ma-structured-toggle' + (active?' active':'') + (disabled?' disabled':'');
    b.textContent=label;
    if (key) b.dataset.maControlKey = key;
    b.setAttribute('aria-pressed', active?'true':'false');
    b.disabled=!!disabled;
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
    const b = makeBtn('', active, 'preset');
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
          else { const [key,label] = item; grid.appendChild(makeBtn(label, !!s[key], key)); }
        });
        section.append(head,grid);
        mod.appendChild(section);
      });
      try{ window.ModeAtlas?.refreshTrainerControls?.(); }catch{}
    };

    try{ buildModifierButtons(); }catch{ if(old) old(); }
    keepModifierMenuOpen(content);
  }

  function keepModifierMenuOpen(drawer){
    const tab = $('#modifiersTab');
    if (!drawer || drawer.dataset.maModifierMenuOwned === 'true') return;
    drawer.dataset.maModifierMenuOwned = 'true';
    ['click','pointerdown','touchstart','mousedown'].forEach(type => {
      drawer.addEventListener(type, event => { event.stopPropagation(); }, true);
    });
    drawer.addEventListener('click', () => {
      try { settings.activeBottomTab = 'modifiers'; } catch {}
      drawer.classList.add('open');
      if (tab) { tab.classList.add('active'); tab.textContent = 'Modifiers ▲'; }
    }, true);
  }

  function currentWrongList(){
    try{
      const per = sessionStats?.perChar || {};
      return Object.entries(per).filter(([_,d])=>Number(d.wrong||0)>0).map(([ch])=>ch);
    }catch{return [];}
  }

  function installSessionUpgrades(){
    // Trainer session lifecycle is owned by the page controller and mode-atlas-session-controls.js.
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
            <div class="ma-progress-track"><span data-ma-progress="${Math.min(100,n)}"></span></div>
            <em>${done?'Complete':'In progress'}</em>
          </article>`;
        }).join('')}
      </div>`;
    window.ModeAtlasUi?.applyProgressWidths?.(panel);
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
