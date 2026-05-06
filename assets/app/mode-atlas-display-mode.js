/* Mode Atlas display mode controller. Owns saved display mode and viewport-derived effective mode. */
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
