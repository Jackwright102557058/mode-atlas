/* Mode Atlas app-wide practice presets.
   Owns the preset definitions and writes the selected preset consistently across Kana Trainer. */
(function ModeAtlasPresetsModule(){
  if(window.ModeAtlasPresets) return;

  const HIRA_ROWS = ['h_a','h_ka','h_sa','h_ta','h_na','h_ha','h_ma','h_ya','h_ra','h_wa'];
  const KATA_ROWS = ['k_a','k_ka','k_sa','k_ta','k_na','k_ha','k_ma','k_ya','k_ra','k_wa'];
  const SETTINGS_KEYS = { reading: 'settings', writing: 'reverseSettings' };
  const UPDATED_AT_KEYS = { reading: 'settingsUpdatedAt', writing: 'reverseSettingsUpdatedAt' };

  const PRESETS = Object.freeze({
    starter: Object.freeze({
      id: 'starter',
      label: 'Starter',
      desc: 'A-row with hints',
      hint: true,
      srs: true,
      dakuten: false,
      yoon: false,
      extendedKatakana: false,
      confusableKana: false,
      hiraganaRows: Object.freeze(['h_a']),
      katakanaRows: Object.freeze([])
    }),
    intermediate: Object.freeze({
      id: 'intermediate',
      label: 'Intermediate',
      desc: 'All Hiragana, no hints',
      hint: false,
      srs: true,
      dakuten: false,
      yoon: false,
      extendedKatakana: false,
      confusableKana: false,
      hiraganaRows: Object.freeze(HIRA_ROWS.slice()),
      katakanaRows: Object.freeze([])
    }),
    advanced: Object.freeze({
      id: 'advanced',
      label: 'Advanced',
      desc: 'Hiragana + Katakana + Dakuten',
      hint: false,
      srs: true,
      dakuten: true,
      yoon: false,
      extendedKatakana: false,
      confusableKana: false,
      hiraganaRows: Object.freeze(HIRA_ROWS.slice()),
      katakanaRows: Object.freeze(KATA_ROWS.slice())
    }),
    pro: Object.freeze({
      id: 'pro',
      label: 'Pro',
      desc: 'Everything enabled',
      hint: false,
      srs: true,
      dakuten: true,
      yoon: true,
      extendedKatakana: true,
      confusableKana: false,
      hiraganaRows: Object.freeze(HIRA_ROWS.slice()),
      katakanaRows: Object.freeze(KATA_ROWS.slice())
    })
  });

  function normaliseId(id){
    const key = String(id || '').trim().toLowerCase();
    if(key === 'a-row') return 'starter';
    return PRESETS[key] ? key : '';
  }

  function readJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch{
      return fallback;
    }
  }

  function writeJSON(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch{}
  }

  function clonePreset(id){
    const preset = PRESETS[normaliseId(id)];
    if(!preset) return null;
    return {
      hint: !!preset.hint,
      srs: !!preset.srs,
      dakuten: !!preset.dakuten,
      yoon: !!preset.yoon,
      extendedKatakana: !!preset.extendedKatakana,
      confusableKana: !!preset.confusableKana,
      hiraganaRows: Array.from(preset.hiraganaRows),
      katakanaRows: Array.from(preset.katakanaRows)
    };
  }

  function buildSettings(base, id){
    const preset = clonePreset(id);
    if(!preset) return null;
    return Object.assign({}, base && typeof base === 'object' ? base : {}, {
      focusWeak: false,
      srs: true,
      endless: false,
      timeTrial: false,
      dailyChallenge: false,
      testMode: false,
      comboKana: false,
      speedRun: false,
      mobileMode: false,
      statsVisible: true,
      scoresVisible: true,
      activeBottomTab: 'modifiers',
      optionsOpen: false
    }, preset);
  }

  function writeBranch(branch, id){
    const settingsKey = SETTINGS_KEYS[branch];
    if(!settingsKey) return null;
    const next = buildSettings(readJSON(settingsKey, {}), id);
    if(!next) return null;
    writeJSON(settingsKey, next);
    const now = String(Date.now());
    localStorage.setItem(UPDATED_AT_KEYS[branch] || 'settingsUpdatedAt', now);
    if(branch === 'reading') localStorage.setItem('settingsUpdatedAt', now);
    try{ window.KanaCloudSync?.markSectionUpdated?.(branch); }catch{}
    return next;
  }

  function notifyPresetApplied(id, opts){
    if(!opts || !opts.notify) return;
    if(opts.source === 'onboarding') return;
    const preset = PRESETS[id];
    const now = Date.now();
    const last = window.__maLastPresetToast || { id: '', at: 0 };
    if(last.id === id && now - last.at < 700) return;
    window.__maLastPresetToast = { id, at: now };
    try{ window.ModeAtlas?.toast?.(`${preset?.label || 'Practice'} preset applied.`, 'ok', 2800); }catch{}
  }

  function apply(id, options){
    id = normaliseId(id);
    if(!id) return false;
    const opts = options || {};
    const target = opts.target || 'both';
    const branches = target === 'reading' ? ['reading'] : target === 'writing' ? ['writing'] : ['reading','writing'];
    const written = {};
    branches.forEach(branch => { written[branch] = writeBranch(branch, id); });
    localStorage.setItem('modeAtlasActivePreset', id);
    localStorage.setItem('modeAtlasDefaultPreset', id);
    localStorage.removeItem('modeAtlasConfusableMode');
    if(opts.source === 'onboarding') localStorage.setItem('modeAtlasOnboardingPreset', id);
    try{ window.KanaCloudSync?.scheduleSync?.(); }catch{}
    notifyPresetApplied(id, opts);
    try{
      window.dispatchEvent(new CustomEvent('modeAtlasPresetChanged', {
        detail: { id, preset: PRESETS[id], target, source: opts.source || 'app', written }
      }));
    }catch{}
    return written;
  }

  function setDefault(id){
    id = normaliseId(id);
    if(!id) return false;
    localStorage.setItem('modeAtlasDefaultPreset', id);
    localStorage.setItem('modeAtlasActivePreset', id);
    return true;
  }

  function arr(value){ return Array.isArray(value) ? value.slice().sort() : []; }
  function sameArray(a, b){
    a = arr(a); b = arr(b);
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  function matchesSettings(settings, id){
    const preset = clonePreset(id);
    if(!preset || !settings || typeof settings !== 'object') return false;
    const bools = ['hint','srs','dakuten','yoon','extendedKatakana','confusableKana'];
    if(!bools.every(key => !!settings[key] === !!preset[key])) return false;
    const incompatibleModes = ['endless','timeTrial','dailyChallenge','testMode','comboKana','focusWeak','speedRun'];
    if(incompatibleModes.some(key => !!settings[key])) return false;
    return sameArray(settings.hiraganaRows, preset.hiraganaRows) && sameArray(settings.katakanaRows, preset.katakanaRows);
  }

  function activePresetFor(branch){
    const stored = normaliseId(localStorage.getItem('modeAtlasActivePreset')) || normaliseId(localStorage.getItem('modeAtlasDefaultPreset'));
    const settings = readJSON(SETTINGS_KEYS[branch] || SETTINGS_KEYS.reading, {});
    if(stored && matchesSettings(settings, stored)) return stored;
    return Object.keys(PRESETS).find(id => matchesSettings(settings, id)) || '';
  }

  window.ModeAtlasPresets = {
    list: Object.freeze(Object.keys(PRESETS).map(id => Object.assign({}, PRESETS[id], {
      hiraganaRows: Array.from(PRESETS[id].hiraganaRows),
      katakanaRows: Array.from(PRESETS[id].katakanaRows)
    }))),
    get: id => PRESETS[normaliseId(id)] || null,
    ids: () => Object.keys(PRESETS),
    normaliseId,
    clonePreset,
    buildSettings,
    apply,
    setDefault,
    matchesSettings,
    activePresetFor
  };
})();
