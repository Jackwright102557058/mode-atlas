/* Mode Atlas global version source.
   Load this before mode-atlas-head-bootstrap.js. The service worker imports it too. */
(function ModeAtlasVersionSource(root){
  var VERSION = '2.18.14-mobile-nav-drawers';
  root.ModeAtlasVersion = VERSION;
  root.MODE_ATLAS_VERSION = VERSION;
})(typeof self !== 'undefined' ? self : window);
