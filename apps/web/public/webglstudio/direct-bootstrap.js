// NPC AI SIM Studio Bootstrap
// Mounts the self-hosted WebGL Studio editor (LiteScene engine) inside a
// container element via an iframe. No external playcanvas.com dependency.
(function() {
  'use strict';

  var EDITOR_URL = '/webglstudio/webglstudio.js-master/editor/wonder.html';

  var containers = new WeakMap();

  function postToFrame(frame, message) {
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage(message, '*');
  }

  function normalizeSceneId(sceneId) {
    return (sceneId || '').toString().trim() || null;
  }

  function createFrame(container, sceneId) {
    var iframe = document.createElement('iframe');
    var src = EDITOR_URL;
    if (sceneId) {
      src += (src.indexOf('?') === -1 ? '?' : '&') + 'sceneId=' + encodeURIComponent(sceneId);
    }
    iframe.src = src;
    iframe.setAttribute('data-wonder-editor', 'true');
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;background:#1a1a2e;';
    iframe.setAttribute('allowfullscreen', 'true');
    container.appendChild(iframe);
    return iframe;
  }

  function mount(container, options) {
    options = options || {};
    var sceneId = normalizeSceneId(options.sceneId);

    if (!container) {
      throw new Error('WonderPlay: mount requires a container element');
    }

    var frame = createFrame(container, sceneId);
    var destroyed = false;
    var readyResolve = null;
    var readyPromise = new Promise(function(resolve) { readyResolve = resolve; });
    var pendingSceneRequests = [];
    var sceneChangeHandler = null;

    var api = {
      destroy: null,
      ready: readyPromise,
      loadScene: null,
      getScene: null,
      onSceneChange: null,
      iframe: frame
    };

    function onMessage(event) {
      if (destroyed) return;
      if (!event.source || event.source !== frame.contentWindow) return;
      var data = event.data || {};
      if (!data || typeof data.type !== 'string') return;

      switch (data.type) {
        case 'wonder_ready':
          if (readyResolve) {
            readyResolve();
            readyResolve = null;
          }
          break;
        case 'scene_loaded':
          // nothing else needed; the scene is already rendered
          break;
        case 'wonder_scene':
          if (pendingSceneRequests.length) {
            var callback = pendingSceneRequests.shift();
            if (callback) callback(data.scene || null);
          }
          break;
        case 'scene_changed':
          if (sceneChangeHandler) sceneChangeHandler(data.scene || null);
          break;
        default:
          break;
      }
    }

    window.addEventListener('message', onMessage);

    api.loadScene = function(newScene, newSceneId) {
      if (destroyed) return;
      if (newSceneId) sceneId = normalizeSceneId(newSceneId);
      postToFrame(frame, { type: 'load_scene', sceneId: sceneId, scene: newScene || null, expectAck: true });
    };

    api.getScene = function() {
      return new Promise(function(resolve) {
        if (destroyed) {
          resolve(null);
          return;
        }
        pendingSceneRequests.push(resolve);
        postToFrame(frame, { type: 'request_scene' });
        // safety timeout in case the editor died
        setTimeout(function() {
          var index = pendingSceneRequests.indexOf(resolve);
          if (index !== -1) {
            pendingSceneRequests.splice(index, 1);
            resolve(null);
          }
        }, 5000);
      });
    };

    api.onSceneChange = function(handler) {
      sceneChangeHandler = typeof handler === 'function' ? handler : null;
    };

    api.destroy = function() {
      if (destroyed) return;
      destroyed = true;
      window.removeEventListener('message', onMessage);
      if (frame && frame.parentNode) {
        frame.parentNode.removeChild(frame);
      }
    };

    return api;
  }

  window.PlayCanvasEditorBootstrap = {
    mount: mount,
    // helpers used by the host page for direct editor access
    EDITOR_URL: EDITOR_URL
  };
})();
