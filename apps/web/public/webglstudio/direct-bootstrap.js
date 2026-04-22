// WebGL Studio Editor Bootstrap
// Unified PlayCanvas + WebGL Studio 3D Engine
// Features: Scene fetch, Object injection, Workspace isolation

(function() {
  'use strict';

  var container = null;
  var sceneId = null;
  var isLoaded = false;
  var workspaceId = null;

  var EDITOR_BASE = '/webglstudio/webglstudio.js-master/editor';

  var STYLES = [
    EDITOR_BASE + '/css/style.css',
    EDITOR_BASE + '/css/litegui.css',
    EDITOR_BASE + '/css/litegraph.css',
  ];

  var SCRIPTS = [
    EDITOR_BASE + '/js/extra/jscolor/jscolor.js',
    EDITOR_BASE + '/js/extra/gl-matrix-min.js',
    EDITOR_BASE + '/js/extra/litegl.js',
    EDITOR_BASE + '/js/extra/litegraph.js',
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

  // Step 0: Check workspace isolation
  function checkWorkspaceIsolation() {
    return new Promise(function(resolve, reject) {
      var stored = localStorage.getItem('scene_workspace_' + sceneId);
      if (stored) {
        workspaceId = stored;
        resolve(true);
        return;
      }

      // Provision workspace via API
      fetch('/api/workspace/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId: sceneId })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.status === 'provisioned' || data.status === 'exists') {
          workspaceId = data.workspaceId || sceneId;
          localStorage.setItem('scene_workspace_' + sceneId, workspaceId);
          resolve(true);
        } else {
          reject(new Error('Workspace provisioning failed'));
        }
      })
      .catch(function() {
        // Allow fallback if API not available
        workspaceId = sceneId;
        resolve(true);
      });
    });
  }

  // Step 1: Fetch scene data
  function fetchSceneData() {
    if (!sceneId) {
      return Promise.resolve(null);
    }
    return fetch('/api/scenes/' + sceneId)
      .then(function(r) {
        if (!r.ok) throw new Error('Scene not found');
        return r.json();
      });
  }

  // Step 2: Inject scene objects into CORE
  function injectScene(core, sceneData) {
    if (!sceneData) return;

    // Create meshes/objects
    if (sceneData.objects) {
      sceneData.objects.forEach(function(obj) {
        try {
          var mesh = core.Mesh(obj.type || 'box');
          if (mesh) {
            if (obj.position) mesh.position = obj.position;
            if (obj.rotation) mesh.rotation = obj.rotation;
            if (obj.scale) mesh.scale = obj.scale;
            if (obj.material) mesh.material = obj.material;
            core.addMesh(mesh);
          }
        } catch (e) {
          console.warn('Failed to create mesh:', obj.type, e);
        }
      });
    }

    // Create lights
    if (sceneData.lights) {
      sceneData.lights.forEach(function(light) {
        try {
          core.addLight(light.type, light.color, light.intensity);
        } catch (e) {
          console.warn('Failed to create light:', light.type, e);
        }
      });
    }

    // Set camera
    if (sceneData.camera && core.setCamera) {
      core.setCamera(
        sceneData.camera.position || [0, 5, 10],
        sceneData.camera.target || [0, 0, 0]
      );
    }

    // Set sky
    if (sceneData.sky && core.setSky) {
      core.setSky(sceneData.sky.color, sceneData.sky.type);
    }
  }

  function showError(message) {
    if (container) {
      container.innerHTML = '<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a2e;color:#ff4444;font-family:system-ui;padding:20px;text-align:center;">' +
        '<h2 style="color:#ff4444;">WORKSPACE ERROR</h2>' +
        '<p style="color:#ccc;margin:10px 0;">' + message + '</p>' +
        '<button onclick="location.reload()" style="padding:10px 20px;background:#444;color:#fff;border:none;cursor:pointer;border-radius:5px;margin-top:15px;">Retry</button>' +
        '</div>';
    }
  }

  function showLoading(message) {
    if (container) {
      container.innerHTML = '<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a2e;color:#00d9ff;font-family:system-ui;">' +
        '<div style="width:40px;height:40px;border:4px solid #333;border-top-color:#00d9ff;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:15px;"></div>' +
        '<p>' + message + '</p>' +
        '<style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>' +
        '</div>';
    }
  }

  function mount(containerEl, options) {
    container = containerEl;
    sceneId = options.sceneId || null;

    showLoading('Checking workspace...');

    // Step 0: Workspace isolation check
    checkWorkspaceIsolation()
      .then(function() {
        showLoading('Loading 3D Engine...');
        // Load styles then scripts
        return Promise.all(STYLES.map(loadStyle));
      })
      .then(function() {
        showLoading('Initializing engine...');
        return Promise.all(SCRIPTS.map(loadScript));
      })
      .then(function() {
        var core = window.CORE;
        if (core && typeof core.init === 'function') {
          core.init();
        }

        // Step 1: Fetch and inject scene
        showLoading('Loading scene: ' + (sceneId || 'default'));
        return fetchSceneData();
      })
      .then(function(sceneData) {
        var core = window.CORE;
        if (sceneData && core) {
          injectScene(core, sceneData);
        }

        // Step 2: Notify ready
        if (window.parent) {
          window.parent.postMessage({
            type: 'ready',
            sceneId: sceneId,
            workspaceId: workspaceId
          }, '*');
        }

        isLoaded = true;
        showLoading = function() {}; // Disable loading overlay
      })
      .catch(function(err) {
        console.error('Engine init failed:', err);
        showError('Failed to initialize: ' + err.message);
      });

    return {
      destroy: function() {
        isLoaded = false;
        if (container) {
          container.innerHTML = '';
        }
        container = null;
      },
      loadScene: function(newSceneId) {
        sceneId = newSceneId;
        var core = window.CORE;
        if (core && sceneId) {
          fetchSceneData()
            .then(function(data) {
              injectScene(core, data);
            });
        }
      }
    };
  }

  window.PlayCanvasEditorBootstrap = {
    mount: mount
  };

})();