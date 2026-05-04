/* Mode Atlas save repair: data cleanup lives with save/storage logic, not UI polish. */
(function ModeAtlasSaveRepairModule(){
  if (window.__modeAtlasSaveRepairLoaded) return;
  window.__modeAtlasSaveRepairLoaded = true;

  function readJSON(key, fallback){
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch(e) { return fallback; }
  }

  function writeJSON(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch(e) { return false; }
  }

  function arrayValue(key){
    var value = readJSON(key, []);
    return Array.isArray(value) ? value : [];
  }

  function signature(item){
    if (item && typeof item === 'object') {
      return String(item.id || item.createdAt || item.completedAt || item.date || item.startedAt || '') + '|' + JSON.stringify(item).slice(0, 220);
    }
    return String(item);
  }

  function dedupeArrayKey(key){
    var input = arrayValue(key);
    if (!input.length) return 0;
    var seen = new Set();
    var output = [];
    input.forEach(function(item){
      var sig = signature(item);
      if (seen.has(sig)) return;
      seen.add(sig);
      output.push(item);
    });
    if (output.length === input.length) return 0;
    writeJSON(key, output);
    return input.length - output.length;
  }


  function ensureSectionTimestamps(){
    var now = Date.now();
    var changed = 0;
    var map = {
      settingsUpdatedAt: ['settings','reverseSettings','modeAtlasThemePreference','modeAtlasDisplayMode'],
      resultsUpdatedAt: ['testModeResults','readingTestModeResults','writingTestModeResults','kanaTrainerReadingTestModeResults','kanaTrainerWritingTestModeResults','charStats','reverseCharStats','charTimes','reverseCharTimes'],
      srsUpdatedAt: ['charSrs','reverseCharSrs'],
      dailyUpdatedAt: ['dailyChallengeHistory','reverseDailyChallengeHistory'],
      profileUpdatedAt: ['modeAtlasLastCloudSyncAt','modeAtlasLastUserId']
    };
    Object.keys(map).forEach(function(tsKey){
      if (localStorage.getItem(tsKey)) return;
      var hasData = map[tsKey].some(function(key){ return localStorage.getItem(key) !== null; });
      if (hasData) { localStorage.setItem(tsKey, String(now)); changed += 1; }
    });
    return changed;
  }

  function repairDataModel(){
    var result = repairSaveData();
    var timestampChanges = ensureSectionTimestamps();
    var meta = {
      settingsUpdatedAt: Number(localStorage.getItem('settingsUpdatedAt') || 0),
      resultsUpdatedAt: Number(localStorage.getItem('resultsUpdatedAt') || 0),
      srsUpdatedAt: Number(localStorage.getItem('srsUpdatedAt') || 0),
      dailyUpdatedAt: Number(localStorage.getItem('dailyUpdatedAt') || 0),
      profileUpdatedAt: Number(localStorage.getItem('profileUpdatedAt') || 0)
    };
    try { window.dispatchEvent(new CustomEvent('modeAtlasDataModelRepaired', { detail: meta })); } catch(e) {}
    return {
      changed: (result.changed || 0) + timestampChanges,
      summary: timestampChanges ? result.summary + ' · timestamps checked' : result.summary,
      meta: meta
    };
  }

  function repairSaveData(){
    var changed = 0;
    [
      'testModeResults',
      'readingTestModeResults',
      'kanaTrainerReadingTestModeResults',
      'writingTestModeResults',
      'kanaTrainerWritingTestModeResults'
    ].forEach(function(key){ changed += dedupeArrayKey(key); });

    if (!localStorage.getItem('modeAtlasDataVersion')) {
      localStorage.setItem('modeAtlasDataVersion', String((window.ModeAtlasEnv && window.ModeAtlasEnv.appVersion) || window.ModeAtlasVersion || 'dev-local'));
      changed += 1;
    }

    try { window.KanaCloudSync && window.KanaCloudSync.scheduleSync && window.KanaCloudSync.scheduleSync(500); } catch(e) {}
    return { changed: changed, summary: changed ? changed + ' cleanup change(s)' : 'no problems found' };
  }

  function bindRepairButtons(){
    document.querySelectorAll('[data-ma-repair-data]').forEach(function(btn){
      if (btn.dataset.maRepairBound === '1') return;
      btn.dataset.maRepairBound = '1';
      btn.addEventListener('click', function(e){
        e.preventDefault();
        var result = repairSaveData();
        try { window.ModeAtlas && window.ModeAtlas.toast && window.ModeAtlas.toast('Repair complete · ' + result.summary, 'ok', 4200); } catch(err) {}
      });
    });
  }

  window.ModeAtlas = window.ModeAtlas || {};
  window.ModeAtlas.repairSaveData = repairSaveData;
  window.ModeAtlas.repairDataModel = repairDataModel;

  function boot(){ repairDataModel(); bindRepairButtons(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  window.addEventListener('pageshow', function(){ setTimeout(bindRepairButtons, 50); });
})();
