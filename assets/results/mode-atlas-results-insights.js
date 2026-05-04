/* Results page compact insights. */
(function(){
  if(window.__modeAtlasResultsInsightsLoaded) return;
  window.__modeAtlasResultsInsightsLoaded = true;
  const $ = (s,r=document)=>r.querySelector(s);
  function isResultsPage(){ try{return (window.ModeAtlasPageName?window.ModeAtlasPageName():(location.pathname.split('/').filter(Boolean).pop()||'index.html')).toLowerCase()==='test.html';}catch{return false;} }
  function render(){
    const M=window.ModeAtlasKanaMetrics;
    if(!isResultsPage() || !M || $('#maCompactResultInsights')) return;
    document.querySelectorAll('#maResultInsights').forEach(x=>x.remove());
    const r=M.statTotals(M.obj('charStats'));
    const w=M.statTotals(M.obj('reverseCharStats'));
    const weak=M.bestWeak();
    const timed=M.ALL.map(ch=>({ch,avg:M.charAvg(ch)})).filter(x=>x.avg).sort((a,b)=>b.avg-a.avg);
    const avg=timed.length?timed.reduce((a,b)=>a+b.avg,0)/timed.length:0;
    const formal=M.formalTestCount();
    const panel=document.createElement('section');
    panel.id='maCompactResultInsights';
    panel.className='ma-compact-results';
    panel.innerHTML=`
      <div class="ma-mini-result-card"><b>Reading accuracy</b><strong>${r.t?r.acc+'%':'—'}</strong><span>${r.t} answers</span></div>
      <div class="ma-mini-result-card"><b>Writing accuracy</b><strong>${w.t?w.acc+'%':'—'}</strong><span>${w.t} answers</span></div>
      <div class="ma-mini-result-card"><b>Average speed</b><strong>${avg?M.formatMs(avg):'—'}</strong><span>${avg&&avg<2000?'Next goal under 1.0s':'Goal under 2.0s'}</span></div>
      <div class="ma-mini-result-card"><b>Slowest tracked</b><strong>${timed[0]?.ch||weak[0]?.ch||'—'}</strong><span>${timed[0]?M.formatMs(timed[0].avg):(weak.length?weak.map(x=>x.ch).join(' · '):'More data needed')}</span></div>
      <div class="ma-mini-result-card"><b>Formal tests</b><strong>${formal}</strong><span>saved result cards</span></div>`;
    const filter=$('#maResultFilterBar');
    if(filter) filter.insertAdjacentElement('afterend',panel);
    else ($('main,.shell,.app-shell')||document.body).prepend(panel);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render); else render();
  window.addEventListener('pageshow',()=>setTimeout(render,50));
})();
