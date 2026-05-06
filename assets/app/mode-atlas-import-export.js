/* Mode Atlas import/export UI. Owns save, backup import preview, and reset-data controls. */
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

  function rebuildSaveSections(){
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
