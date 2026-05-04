(function ModeAtlasStudyCloudBindings(){
  'use strict';

  function updateStudyTopProfileDot() {
    const dot = document.getElementById('studyTopProfileDot') || document.getElementById('topProfileDot') || document.getElementById('profileDot');
    if (!dot || !window.KanaCloudSync) return;
    const user = window.KanaCloudSync.getUser?.();
    if (user?.photoURL) {
      dot.innerHTML = `<img src="${String(user.photoURL).replace(/"/g, '&quot;')}" alt="" />`;
      return;
    }
    const label = (user?.displayName || user?.email || 'M').trim();
    dot.textContent = (label[0] || 'M').toUpperCase();
  }

  function bindCloudProfile() {
    if (!window.KanaCloudSync?.bindUi) return false;
    const signInBtn = document.getElementById('studyProfileSignIn') || document.getElementById('profileSignInBtn');
    const signOutBtn = document.getElementById('studyProfileSignOut') || document.getElementById('profileSignOutBtn');
    const statusEl = document.getElementById('studyProfileStatus') || document.getElementById('profileStatus');
    const nameEl = document.getElementById('studyProfileName') || document.getElementById('profileName');
    const emailEl = document.getElementById('studyProfileEmail') || document.getElementById('profileEmail');
    const photoEl = document.getElementById('studyProfileAvatar') || document.getElementById('profileAvatar');
    window.KanaCloudSync.bindUi({ signInBtn, signOutBtn, statusEl, nameEl, emailEl, photoEl });
    updateStudyTopProfileDot();
    window.ModeAtlasProfile?.refresh?.();
    return true;
  }

  (window.KanaCloudSync?.beforePageLoad?.() || Promise.resolve()).then(() => {
    bindCloudProfile();
    setTimeout(bindCloudProfile, 300);
    setTimeout(bindCloudProfile, 1200);
    try { if (typeof window.refreshSaveBackedStateFromCloud === 'function') window.refreshSaveBackedStateFromCloud(); }
    catch (err) { console.warn('Trainer refresh after cloud bind failed', err); }
  }).catch((error) => {
    console.warn('Cloud profile controls could not load.', error);
    const status = document.getElementById('studyProfileStatus') || document.getElementById('profileStatus');
    if (status) status.textContent = 'Profile is available, but cloud sign-in could not load on this page.';
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-profile-sign-in],[data-profile-sign-out]')) {
      setTimeout(updateStudyTopProfileDot, 300);
      setTimeout(updateStudyTopProfileDot, 1200);
    }
  });
})();
