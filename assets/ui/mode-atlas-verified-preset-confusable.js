/* Legacy compatibility bridge for older preset/confusable links. */
(function(){
  if(window.__modeAtlasPresetCompatibility) return;
  window.__modeAtlasPresetCompatibility = true;
  function normaliseId(id){
    try{ return window.ModeAtlasPresets?.normaliseId?.(id) || String(id || '').trim().toLowerCase(); }
    catch{ return String(id || '').trim().toLowerCase(); }
  }
  function currentBranch(){
    let name='';
    try{ name=window.ModeAtlasPageName?window.ModeAtlasPageName():location.pathname; }catch{}
    name=String(name||'').toLowerCase();
    return (name.includes('writing') || name.includes('reverse')) ? 'writing' : 'reading';
  }
  function refreshTrainer(){
    try{ if(typeof window.rebuildCharMap==='function') window.rebuildCharMap(); }catch{}
    try{ if(typeof window.buildModifierButtons==='function') window.buildModifierButtons(); }catch{}
    try{ if(typeof window.renderHeatmap==='function') window.renderHeatmap(); }catch{}
    try{ if(typeof window.updateTopStats==='function') window.updateTopStats(); }catch{}
    try{ if(typeof window.updateTrialConfigVisibility==='function') window.updateTrialConfigVisibility(); }catch{}
    try{ if(typeof window.saveAll==='function') window.saveAll(); }catch{}
  }
  window.ModeAtlas = window.ModeAtlas || {};
  window.ModeAtlas.applyPracticePreset = function(id){
    id = normaliseId(id);
    if(!id || !window.ModeAtlasPresets?.apply) return false;
    const applied = window.ModeAtlasPresets.apply(id, { target: currentBranch(), source: 'compatibility', notify: true });
    if(applied) refreshTrainer();
    return !!applied;
  };
})();
