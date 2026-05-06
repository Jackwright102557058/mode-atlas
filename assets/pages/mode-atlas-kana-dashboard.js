/* Kana Trainer dashboard extras and mastery panels. */
(function(){
  if(window.__modeAtlasKanaDashboardLoaded) return;
  window.__modeAtlasKanaDashboardLoaded = true;

  const M = () => window.ModeAtlasKanaMetrics;
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  function isKanaPage(){ return M()?.pageName?.() === 'kana.html'; }
  function esc(s){ return String(s ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function updateExistingKanaNumbers(stats){
    const set=(id,value)=>{ const el=document.getElementById(id); if(el) el.textContent=value; };
    set('heroReadingHigh', stats.readingHigh || 0);
    set('heroWritingHigh', stats.writingHigh || 0);
    set('readingToughest', stats.readingWorst);
    set('readingStrongest', stats.readingBest);
    set('writingToughest', stats.writingWorst);
    set('writingStrongest', stats.writingBest);
  }

  function renderDashboard(){
    if(!isKanaPage() || $('#maKanaProDashboard') || !M()) return;
    const stats=M().kanaStats();
    const hero=$('.hero.glass') || $('.hero') || $('.shell');
    if(!hero?.parentElement) return;
    const reviewText=([stats.readingWorst,stats.writingWorst].filter(x=>x&&x!=='—').slice(0,2).join(' / ')) || '—';
    const nextHref=localStorage.getItem('modeAtlasLastKanaPage') || '/reading/';
    const panel=document.createElement('section');
    panel.id='maKanaProDashboard';
    panel.className='ma-kana-pro-card';
    panel.innerHTML=`
      <div class="ma-kana-pro-head">
        <div>
          <h2 class="ma-kana-pro-title">Today’s Kana Trainer dashboard</h2>
          <div class="ma-kana-pro-sub">Your hub for Reading Practice, Writing Practice, daily review, results, and recommended next steps.</div>
        </div>
        <div class="ma-kana-pro-pills"><span class="ma-kana-pill reading">Reading green</span><span class="ma-kana-pill writing">Writing blue</span></div>
      </div>
      <div class="ma-kana-stat-grid">
        <div class="ma-kana-stat"><div class="label">Current streak</div><div class="value">${stats.streak}</div><div class="hint">daily challenge days</div></div>
        <div class="ma-kana-stat"><div class="label">Today</div><div class="value">${stats.dailyDone?'Done':'Ready'}</div><div class="hint">daily challenge status</div></div>
        <div class="ma-kana-stat"><div class="label">Kana seen</div><div class="value">${Math.max(stats.readingKnown,stats.writingKnown)}</div><div class="hint">tracked in practice</div></div>
        <div class="ma-kana-stat"><div class="label">Formal tests</div><div class="value">${M().formalTestCount()}</div><div class="hint">saved result cards</div></div>
      </div>
      <div class="ma-kana-stat-grid">
        <div class="ma-kana-stat"><div class="label">Reading accuracy</div><div class="value">${stats.readingAccuracy ? stats.readingAccuracy+'%' : '—'}</div><div class="hint">${stats.readingAnswers} answers</div></div>
        <div class="ma-kana-stat"><div class="label">Writing accuracy</div><div class="value">${stats.writingAccuracy ? stats.writingAccuracy+'%' : '—'}</div><div class="hint">${stats.writingAnswers} answers</div></div>
        <div class="ma-kana-stat"><div class="label">Review next</div><div class="value">${esc(reviewText)}</div><div class="hint">weakest tracked kana</div></div>
        <div class="ma-kana-stat"><div class="label">Mastery map</div><div class="value">${Math.max(stats.readingKnown,stats.writingKnown)}/104</div><div class="hint">kana with saved history</div></div>
      </div>
      <div class="ma-kana-plan">
        <div><div class="label">Recommended flow</div><strong>Review → Practice → Test</strong><span>Start with weak kana, then complete a focused Reading or Writing session before checking results.</span></div>
        <div><div class="label">Smart review</div><strong>${esc(reviewText==='—'?'Build more history':reviewText)}</strong><span>${reviewText==='—'?'Finish a few sessions to unlock stronger recommendations.':'Prioritise these kana first in your next session.'}</span></div>
      </div>
      <div class="ma-action-row"><a class="primary" href="${esc(nextHref)}">Continue where you left off</a><a class="reading" href="/reading/">Reading Practice</a><a class="writing" href="/writing/">Writing Practice</a><a href="/results/">Results</a></div>`;
    hero.insertAdjacentElement('afterend', panel);
    const footer=$('.footer-note'); if(footer) footer.textContent='Kana Trainer dashboard reads from Reading, Writing, Results, and daily review progress.';
    updateExistingKanaNumbers(stats);
  }

  function renderProFeatures(){
    if(!isKanaPage() || $('#maKanaProFeatures') || !M()) return;
    const dash=$('#maKanaProDashboard') || $('.ma-kana-pro-card');
    if(!dash) return;
    const stats=M().kanaStats();
    const weak=M().bestWeak();
    const weakText=weak.length ? weak.map(x=>x.ch).join(' / ') : 'More history needed';
    const stages=[['A-row',stats.known>=5],['Hiragana',stats.known>=46],['Katakana',stats.known>=92],['Dakuten',stats.known>=104],['Yōon',stats.known>=130],['Extended',stats.known>=150]];
    const nextIdx=Math.max(0,stages.findIndex(x=>!x[1]));
    const wrap=document.createElement('section');
    wrap.id='maKanaProFeatures';
    wrap.className='ma-kana-pro-card';
    wrap.innerHTML=`
      <div class="ma-kana-pro-head"><div><h2 class="ma-kana-pro-title">Trainer roadmap</h2><div class="ma-kana-pro-sub">A cleaner overview of what to practise next, without mixing in other Mode Atlas sections.</div></div><div class="ma-kana-pro-pills"><span class="ma-kana-pill reading">Review</span><span class="ma-kana-pill writing">Test</span></div></div>
      <div class="ma-pro-feature-grid">
        <div class="ma-pro-feature-card"><div class="label">Next best action</div><strong>${weakText==='More history needed'?'Complete a short session':'Review '+esc(weakText)}</strong><span>${weakText==='More history needed'?'Finish a Reading and Writing session to unlock smarter recommendations.':'These are currently your weakest tracked kana across Reading/Writing.'}</span></div>
        <div class="ma-pro-feature-card"><div class="label">Confusable drill</div><strong>シ / ツ · ソ / ン</strong><span>Practise kana that are visually easy to mix up.</span></div>
        <div class="ma-pro-feature-card"><div class="label">Formal testing</div><strong>${stats.tests} saved test${stats.tests===1?'':'s'}</strong><span>Use Results after a full test to compare speed, accuracy, and weak kana.</span></div>
      </div>
      <div class="ma-path-track">${stages.map((st,i)=>`<div class="ma-path-step ${st[1]?'done':i===nextIdx?'next':''}"><b>${st[0]}</b><small>${st[1]?'Tracked':i===nextIdx?'Next':'Locked'}</small></div>`).join('')}</div>`;
    dash.insertAdjacentElement('afterend',wrap);
  }

  function renderPresetChecklist(){
    if(!isKanaPage() || $('#maPresetChecklist') || !M()) return;
    const anchor=$('#maKanaProFeatures') || $('#maKanaProDashboard') || $('.ma-kana-pro-card') || $('.hero') || $('main');
    if(!anchor) return;
    const panel=document.createElement('section');
    panel.id='maPresetChecklist';
    panel.className='ma-kana-pro-card ma-preset-checklist';
    panel.innerHTML=`
      <div class="ma-kana-pro-head"><div><h2 class="ma-kana-pro-title">Preset achievements</h2><div class="ma-kana-pro-sub">Get 100 correct answers over time in each preset. Nothing is locked — this is just a progress tracker.</div></div></div>
      <div class="ma-achievement-grid">${M().PRESET_TRACKERS.map(p=>{ const n=Math.min(100,p.chars.reduce((sum,ch)=>sum+M().charCorrect(ch),0)); const done=n>=100; return `<article class="ma-achievement-card ${done?'done':''}"><div class="ma-achievement-top"><b>${p.name}</b><span>${n}/100</span></div><small>${p.desc}</small><div class="ma-progress-track"><span data-ma-progress="${n}"></span></div><em>${done?'Complete':'In progress'}</em></article>`; }).join('')}</div>`;
    anchor.insertAdjacentElement('afterend', panel);
    window.ModeAtlasUi?.applyProgressWidths?.(panel);
    renderSpeedMastery(panel);
  }

  function renderSpeedMastery(afterEl){
    if(!isKanaPage() || $('#maSpeedMasteryPanel') || !M()) return;
    const counts=M().masteryCounts();
    const weak=M().bestWeak();
    const timed=M().ALL.map(ch=>({ch,avg:M().charAvg(ch),label:M().masteryLabel(ch)})).filter(x=>x.avg).sort((a,b)=>a.avg-b.avg);
    const fast=timed.filter(x=>x.avg<=2000).length;
    const fluent=timed.filter(x=>x.avg<=1000).length;
    const average=timed.length?timed.reduce((a,b)=>a+b.avg,0)/timed.length:0;
    const pct=n=>Math.min(100,Math.round((n/Math.max(1,M().ALL.length))*100));
    const nextGoal=average&&average<2000?'Push toward fluent pace under 1.0s.':'Build consistency toward the 2.0s recognition goal.';
    const panel=document.createElement('section');
    panel.id='maSpeedMasteryPanel';
    panel.className='ma-kana-pro-card ma-speed-mastery';
    panel.innerHTML=`
      <div class="ma-kana-pro-head"><div><h2 class="ma-kana-pro-title">Speed & mastery</h2><div class="ma-kana-pro-sub">Track how quickly and reliably you recognise kana. Speed is useful, but mastery also needs repeated correct answers.</div></div><button type="button" class="ma-mastery-open-btn" data-ma-mastery-open>Open Mastery Map</button></div>
      <div class="ma-mastery-hero"><div><span>Current focus</span><strong>${esc(nextGoal)}</strong><small>${weak.length?'Suggested review: '+weak.map(x=>x.ch).join(' · '):'Complete more sessions to unlock personalised review suggestions.'}</small></div><div><span>Average recognition</span><strong>${average?M().formatMs(average):'More data needed'}</strong><small>Only kana with saved timing history are included.</small></div></div>
      <div class="ma-speed-grid"><div class="ma-speed-card"><span class="label">Goal pace</span><strong>${fast}</strong><small>kana under 2.0s</small><div class="ma-meter"><i data-ma-progress="${pct(fast)}"></i></div></div><div class="ma-speed-card"><span class="label">Fluent pace</span><strong>${fluent}</strong><small>kana under 1.0s</small><div class="ma-meter"><i data-ma-progress="${pct(fluent)}"></i></div></div><div class="ma-speed-card"><span class="label">Mastered</span><strong>${counts.Mastered}</strong><small>accurate, repeated, and near target speed</small><div class="ma-meter"><i data-ma-progress="${pct(counts.Mastered)}"></i></div></div><div class="ma-speed-card"><span class="label">Needs attention</span><strong>${counts.Learning+counts.Reviewing}</strong><small>${counts.Reviewing} reviewing · ${counts.Learning} learning</small></div></div>
      <div class="ma-mastery-breakdown"><div><b>New</b><span>${counts.New} kana have not been practised yet.</span></div><div><b>Learning</b><span>${counts.Learning} kana are still building accuracy or attempts.</span></div><div><b>Reviewing</b><span>${counts.Reviewing} kana are mostly correct but need more reliable reps.</span></div><div><b>Mastered</b><span>${counts.Mastered} kana are accurate and near target speed.</span></div></div>
      <div class="ma-practice-actions"><a class="ma-action-card reading" href="/reading/?focusWeak=1" data-ma-weak-review><strong>Review weakest kana</strong><span>${weak.length?weak.map(x=>x.ch).join(' · '):'Build more history to unlock this'}</span></a></div>`;
    afterEl.insertAdjacentElement('afterend', panel);
    window.ModeAtlasUi?.applyProgressWidths?.(panel);
  }

  function bindActions(){
    if(window.__maKanaDashboardActionsBound) return;
    window.__maKanaDashboardActionsBound=true;
    document.addEventListener('click', e=>{
      if(e.target.closest('[data-ma-confusable-link]')){ localStorage.setItem('modeAtlasConfusableMode','1'); localStorage.removeItem('modeAtlasActivePreset'); }
      if(e.target.closest('[data-ma-weak-review]')){
        const key='settings';
        const current=M()?.json?.(key,{}) || {};
        Object.assign(current,{focusWeak:true,srs:true,endless:false,timeTrial:false,dailyChallenge:false,testMode:false});
        try{window.ModeAtlasStorage?.setJSON?.(key,current);}catch{}
        localStorage.removeItem('modeAtlasConfusableMode');
      }
    },true);
  }

  function boot(){ renderDashboard(); renderProFeatures(); renderPresetChecklist(); bindActions(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('pageshow',()=>setTimeout(boot,50));
})();
