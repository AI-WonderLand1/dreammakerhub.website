// WebGL Studio Editor Bootstrap
// Your custom private cloud-based 3D editor

(function() {
  'use strict';

  var container = null;
  var sceneId = null;
  var isLoaded = false;

  var EDITOR_BASE = '/webglstudio/webglstudio.js-master/editor';

  var STYLES = [
    EDITOR_BASE + '/css/style.css',
    EDITOR_BASE + '/css/litegui.css',
    EDITOR_BASE + '/css/litegraph.css',
  ];

var SCRIPTS = [
  EDITOR_BASE + '/js/extra/jscolor/jscolor.js',
  EDITOR_BASE + '/js/extra/gl-matrix-min.js',
  EDITOR_BASE + '/js/extra/litegl.js',     // MUST load before litegui.js (defines LEvent)
  EDITOR_BASE + '/js/extra/litegraph.js',   // MUST load before litescene.js
  EDITOR_BASE + '/js/extra/canvas-to-blob.js',
  EDITOR_BASE + '/js/extra/pako.js',
  EDITOR_BASE + '/js/extra/litescene.js',
  EDITOR_BASE + '/js/extra/litegui.js',
  EDITOR_BASE + '/js/extra/jszip.js',
  EDITOR_BASE + '/js/utils/utils.js',
  EDITOR_BASE + '/js/core.js',
];

  function loadStyle(href) {
    return new Promise(function(resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = function() { resolve(); };
      link.onerror = function() { reject(new Error('Failed to load style: ' + href)); };
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.onload = function() { resolve(); };
      script.onerror = function() { reject(new Error('Failed to load script: ' + src)); };
      document.body.appendChild(script);
    });
  }

  function mount(containerEl, options) {
    container = containerEl;
    sceneId = options.sceneId;

    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#00d9ff;font-family:system-ui;">Loading WebGL Studio...</div>';

    // Load styles then scripts
    Promise.all(STYLES.map(loadStyle))
      .then(function() {
        return Promise.all(SCRIPTS.map(loadScript));
      })
      .then(function() {
        var core = window.CORE;
        if (core && typeof core.init === 'function') {
          core.init();
        }
        
        if (window.parent) {
          window.parent.postMessage({ type: 'ready', sceneId: sceneId }, '*');
        }
        
        isLoaded = true;
      })
      .catch(function(err) {
        container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#ff4444;font-family:system-ui;padding:20px;text-align:center;">Failed to load WebGL Studio: ' + err.message + '</div>';
      });

    return {
      destroy: function() {
        isLoaded = false;
        if (container) {
          container.innerHTML = '';
        }
        container = null;
      }
    };
  }

  window.PlayCanvasEditorBootstrap = {
    mount: mount
  };

})();