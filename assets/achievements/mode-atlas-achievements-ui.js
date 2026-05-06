/* Mode Atlas achievements and mastery UI. */
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
  
function applyAchievementVisuals(root = document) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("[data-ma-ach-accent]").forEach(el => {
        el.style.setProperty("--ma-ach-accent", el.dataset.maAchAccent || "96,165,250");
    });
    window.ModeAtlasUi?.applyProgressWidths?.(scope);
}

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
    return `<button type="button" class="ma-achievement-tile branch-${esc(branch)} ${done?'done':''}" data-ma-ach-accent="${visual.accent}" data-ma-ach-id="${esc(id)}" aria-label="${esc(item.name+' '+item.tier)} achievement details">
      <div class="ma-ach-topline"><span class="ma-ach-status-text">${done?'Unlocked':pct+'%'}</span></div>
      <span class="ma-ach-graphic" aria-hidden="true">${esc(visual.icon)}</span>
      <strong>${esc(item.name)}</strong>
      <em>${esc(item.tier)}</em>
      <small>${esc(item.short)}</small>
      <div class="ma-ach-meter" aria-hidden="true"><span class="ma-ach-meter-fill" data-ma-progress="${pct}"></span><span class="ma-ach-meter-label">${pct}%</span></div>
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
    const achInfoBody = pop.querySelector('.ma-ach-info-body');
    achInfoBody.innerHTML=`<div class="ma-ach-info-topbar"><div class="ma-ach-info-hero branch-${esc(item.branch)} ${item.done?'done':''}" data-ma-ach-accent="${item.accent||'96,165,250'}"><span class="ma-ach-info-symbol" aria-hidden="true">${esc(item.icon||'✦')}</span><div><span class="ma-ach-info-kicker">${esc(item.branchLabel||item.branch.replace(/^./,c=>c.toUpperCase()))}</span><h3>${esc(item.name)} <em>${esc(item.tier)}</em></h3></div></div><button type="button" class="ma-ach-info-close-inline" data-ma-ach-info-close>Close</button></div><p class="ma-ach-info-copy">${esc(item.detail)}</p><div class="ma-ach-info-progress"><div class="ma-ach-info-progress-row"><strong>${item.done?'Unlocked':'In progress'}</strong><span>${Math.min(item.value,item.target)} / ${item.target}</span></div><i><b data-ma-progress="${item.pct}"></b></i></div>`;
    applyAchievementVisuals(achInfoBody);
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
    const featureContent = shell.querySelector('.ma-feature-content');
    featureContent.innerHTML = kind==='mastery' ? renderMasteryMap() : renderAchievements();
    applyAchievementVisuals(featureContent);
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
