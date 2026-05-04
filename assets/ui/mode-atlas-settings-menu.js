(function ModeAtlasSettingsMenuMarkup(){
  'use strict';
  if (window.ModeAtlasSettingsMenu) return;

  window.ModeAtlasSettingsMenu = {
    markup(){
      return `
        <div class="ma-drawer-backdrop ma-settings-backdrop" id="settingsBackdrop" data-ma-drawer-close="settings"></div>
        <aside class="ma-shared-settings-drawer" id="settingsDrawer" data-ma-shared-drawer="settings" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="settingsDrawerTitle">
          <div class="ma-drawer-head ma-settings-head">
            <div>
              <div class="ma-menu-kicker">Mode Atlas</div>
              <div class="ma-drawer-title" id="settingsDrawerTitle">Settings</div>
            </div>
            <button class="ma-drawer-close" id="settingsCloseBtn" type="button" data-ma-drawer-close="settings" aria-label="Close settings">Close</button>
          </div>

          <section class="ma-settings-card ma-save-section" aria-label="Save and import">
            <div class="ma-settings-title">Save / Import</div>
            <div class="ma-settings-grid two">
              <button class="ma-menu-action ma-settings-choice ma-primary" type="button" data-ma-unified-export>Export save</button>
              <button class="ma-menu-action ma-settings-choice" type="button" data-ma-unified-copy>Copy save</button>
              <button class="ma-menu-action ma-settings-choice" type="button" data-ma-unified-import>Import save</button>
              <button class="ma-menu-action ma-settings-choice ma-danger" type="button" data-ma-unified-reset>Reset data</button>
            </div>
            <input type="file" accept=".json,application/json" data-ma-unified-file style="display:none" />
          </section>

          <section class="ma-settings-card ma-settings-panel ma-display-panel" aria-label="Display mode">
            <div class="ma-settings-title">Display</div>
            <div class="ma-settings-grid four">
              <button class="ma-menu-action ma-settings-choice ma-display-option" data-display="auto" type="button">Auto</button>
              <button class="ma-menu-action ma-settings-choice ma-display-option" data-display="desktop" type="button">PC / Laptop</button>
              <button class="ma-menu-action ma-settings-choice ma-display-option" data-display="tablet" type="button">iPad</button>
              <button class="ma-menu-action ma-settings-choice ma-display-option" data-display="phone" type="button">Phone</button>
            </div>
          </section>

          <section class="ma-settings-card ma-settings-panel ma-sound-panel" aria-label="Sound">
            <div class="ma-settings-title">Sound</div>
            <div class="ma-settings-grid three">
              <button type="button" class="ma-menu-action ma-settings-choice ma-sound-toggle" data-ma-sound-choice="soft">On</button>
              <button type="button" class="ma-menu-action ma-settings-choice ma-sound-toggle" data-ma-sound-choice="loud">Loud</button>
              <button type="button" class="ma-menu-action ma-settings-choice ma-sound-toggle" data-ma-sound-choice="off">Off</button>
            </div>
          </section>

          <section class="ma-settings-card ma-settings-panel ma-theme-panel" aria-label="Appearance">
            <div class="ma-settings-title">Appearance</div>
            <div class="ma-settings-grid three">
              <button class="ma-menu-action ma-settings-choice ma-theme-choice-btn" type="button" data-ma-theme-choice="dark">Dark</button>
              <button class="ma-menu-action ma-settings-choice ma-theme-choice-btn" type="button" data-ma-theme-choice="light">Light</button>
              <button class="ma-menu-action ma-settings-choice ma-theme-choice-btn" type="button" data-ma-theme-choice="system">System</button>
            </div>
          </section>

          <section class="ma-settings-card ma-settings-panel ma-tools-panel" aria-label="App tools">
            <div class="ma-settings-title">App</div>
            <div class="ma-settings-grid two">
              <button class="ma-menu-action ma-settings-choice" type="button" data-ma-about-open>About Mode Atlas</button>
              <button class="ma-menu-action ma-settings-choice" type="button" data-ma-repair-data>Repair save data</button>
              <button class="ma-menu-action ma-settings-choice" type="button" data-ma-install>Install app</button>
            </div>
          </section>
        </aside>`;
    }
  };
})();
