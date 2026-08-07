// WonderPlay 3D Studio Bridge
// Runs INSIDE the self-hosted WebGL Studio editor iframe. Connects the
// LiteScene engine to the host app via postMessage. Zero external
// (playcanvas.com) dependencies.
//
// Message protocol
//   host -> editor:  { type: 'load_scene' | 'request_scene' | 'add_primitive' | 'clear_scene', ... }
//   editor -> host:  { type: 'wonder_ready' | 'scene_loaded' | 'wonder_scene' | 'scene_changed', ..., source: 'wonder-editor' }
(function() {
  'use strict';

  var ready = false;
  var sceneId = null;
  var exportTimer = null;
  var exportPending = false;
  var queuedMessages = [];
  var cameraConfigured = false;

  // Map our scene "geometry"/"type" names to LiteScene primitives.
  var PRIMITIVES = {
    'box': 'CUBE',
    'cube': 'CUBE',
    'plane': 'PLANE',
    'quad': 'QUAD',
    'sphere': 'SPHERE',
    'cylinder': 'CYLINDER',
    'cone': 'CONE',
    'circle': 'CIRCLE',
    'hemisphere': 'HEMISPHERE',
    'icosahedron': 'ICOSAHEDRON'
  };

  function postToParent(message) {
    if (window.parent && window.parent !== window) {
      message.source = 'wonder-editor';
      window.parent.postMessage(message, '*');
    }
  }

  function toVec3(value, fallback) {
    var out = fallback || [0, 0, 0];
    if (!value) return out;
    if (Array.isArray(value)) return [value[0] || 0, value[1] || 0, value[2] || 0];
    if (value.length) return [value[0] || 0, value[1] || 0, value[2] || 0];
    if (value.x !== undefined || value.y !== undefined || value.z !== undefined) {
      return [value.x || 0, value.y || 0, value.z || 0];
    }
    if (typeof value === 'number') return [value, value, value];
    return out;
  }

  function isHexColor(value) {
    return typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  }

  function hexToVec3(hex) {
    var normalized = hex.replace('#', '');
    if (normalized.length === 3) {
      normalized = normalized.split('').map(function(c) { return c + c; }).join('');
    }
    var num = parseInt(normalized, 16);
    return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
  }

  function applyVec3(target, value) {
    if (!target || !value) return;
    try {
      if (isHexColor(value)) {
        target.set(hexToVec3(value));
      } else {
        target.set(toVec3(value));
      }
    } catch (e) {}
  }

  function setNodeTransform(node, transform) {
    if (!transform || !node || !node.transform) return;
    if (transform.position) {
      try { node.transform.position.set(toVec3(transform.position)); } catch (e) {}
    }
    if (transform.rotation) {
      try { node.transform.rotation.set(toVec3(transform.rotation)); } catch (e) {}
    }
    if (transform.scale || transform.scaling) {
      try { node.transform.scaling.set(toVec3(transform.scale || transform.scaling)); } catch (e) {}
    } else if (transform.size !== undefined) {
      try { node.transform.scaling.set([transform.size, transform.size, transform.size]); } catch (e) {}
    }
  }

  function makePrimitiveComponent(geometryName, size) {
    var GP = LS.Components.GeometricPrimitive;
    var constant = PRIMITIVES[String(geometryName || '').toLowerCase()] || 'CUBE';
    var value = GP[constant];
    if (value === undefined) value = GP.CUBE;
    return new GP({ geometry: value, size: (size || 1), subdivisions: 24 });
  }

  function buildMaterial(materialInfo) {
    var info = materialInfo || {};
    if (typeof info === 'string') return null;
    var mat;
    try {
      mat = new LS.StandardMaterial();
    } catch (e) {
      return null;
    }
    var color = info.color;
    if (color) applyVec3(mat.diffuse, color);
    var emissive = info.emissive;
    if (emissive) applyVec3(mat.emissive, emissive);
    if (info.opacity !== undefined) {
      try { mat.opacity = info.opacity; } catch (e) {}
    }
    if (info.transparent && LS.Blend) {
      try { mat.blend_mode = LS.Blend.ALPHA; } catch (e) {}
    }
    try { mat.update && mat.update(); } catch (e) {}
    return mat;
  }

  function addObject(obj, index) {
    var name = obj.name || obj.id || ('Object_' + (index + 1));
    var node = new LS.SceneNode(name);

    setNodeTransform(node, obj.transform || obj);

    var geometry = obj.geometry || obj.primitive;
    var meshUrl = obj.meshUrl || obj.mesh || obj.url;

    if (meshUrl && (!geometry || geometry === 'mesh')) {
      var renderer = new LS.Components.MeshRenderer();
      renderer.mesh = meshUrl;
      node.addComponent(renderer);
    } else {
      var geometryName = geometry && geometry !== 'mesh' ? geometry : 'cube';
      node.addComponent(makePrimitiveComponent(geometryName, obj.size || 1));
    }

    var material = obj.material ? buildMaterial(obj.material) : null;
    if (!material && obj.color) {
      material = buildMaterial({ color: obj.color });
    }
    if (material && node.getComponent(LS.Components.MeshRenderer)) {
      try { node.getComponent(LS.Components.MeshRenderer).material = material; } catch (e) {}
    } else if (material) {
      try { node.addComponent(material); } catch (e) {}
    }

    LS.GlobalScene.root.addChild(node);
    return node;
  }

  var LIGHT_TYPES = {
    'directional': 'DIRECTIONAL',
    'spot': 'SPOT',
    'point': 'OMNI',
    'omni': 'OMNI'
  };

  // Converts a direction vector into Euler angles (degrees) that match
  // LiteScene's rotation order (XYZ applied to FRONT = [0, 0, -1]).
  function directionToEuler(direction) {
    var v = toVec3(direction, [0, 0, -1]);
    var len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    var x = v[0] / len, y = v[1] / len, z = v[2] / len;
    var yaw = Math.atan2(x, -z) * 180 / Math.PI;
    var pitch = Math.asin(y) * 180 / Math.PI;
    return [pitch, yaw, 0];
  }

  function addLight(light, index) {
    var typeName = LIGHT_TYPES[String(light.type || light.lightType || '').toLowerCase()];
    if (!typeName) return null;

    var name = light.name || light.id || ('Light_' + (index + 1));
    var node = new LS.SceneNode(name);

    var transform = light.transform || {};
    if (light.position) {
      try { node.transform.position.set(toVec3(light.position)); } catch (e) {}
    } else if (transform.position) {
      try { node.transform.position.set(toVec3(transform.position)); } catch (e) {}
    }

    if (transform.rotation) {
      try { node.transform.rotation.set(toVec3(transform.rotation)); } catch (e) {}
    } else if (light.direction) {
      try { node.transform.rotation.set(directionToEuler(light.direction)); } catch (e) {}
    }

    var component = new LS.Light();
    component.type = LS.Light[typeName] !== undefined ? LS.Light[typeName] : LS.Light.OMNI;
    if (light.color) applyVec3(component.color, light.color);
    component.intensity = (light.intensity !== undefined) ? light.intensity : 1;
    if (light.angle !== undefined) {
      try { component.angle = light.angle; } catch (e) {}
    }
    node.addComponent(component);
    LS.GlobalScene.root.addChild(node);
    return node;
  }

  function setSceneAmbientColor(color) {
    if (!color || !LS.GlobalScene || !LS.GlobalScene.info) return;
    try {
      applyVec3(LS.GlobalScene.info.ambient_color, color);
    } catch (e) {}
  }

  function configureCamera(camera) {
    if (!camera) return;
    var current = null;
    try { current = RenderModule.getActiveCamera(); } catch (e) {}
    if (!current) {
      try { current = LS.GlobalScene.getActiveCameras()[0]; } catch (e2) {}
    }
    if (!current) return;
    cameraConfigured = true;

    if (camera.position) applyVec3(current.eye, camera.position);
    if (camera.target) applyVec3(current.center, camera.target);
    if (camera.fov !== undefined) {
      try { current.fov = camera.fov; } catch (e) {}
    }
    if (camera.near !== undefined) {
      try { current.near = camera.near; } catch (e) {}
    }
    if (camera.far !== undefined) {
      try { current.far = camera.far; } catch (e) {}
    }
    if (camera.background_color || camera.clearColor) {
      applyVec3(current.background_color, camera.background_color || camera.clearColor);
    }
  }

  function configureSky(sky) {
    if (!sky) return;
    var current = null;
    try { current = RenderModule.getActiveCamera(); } catch (e) {}
    if (current && sky.color && current.background_color) {
      applyVec3(current.background_color, sky.color);
    }
  }

  function buildScene(scene) {
    if (!scene) return;
    cameraConfigured = false;
    try {
      LS.GlobalScene.clear();
    } catch (e) {}

    // Schema format: { objects, lights, camera, skybox }
    if (Array.isArray(scene.objects)) {
      scene.objects.forEach(function(obj, i) { addObject(obj, i); });
    }
    if (Array.isArray(scene.lights)) {
      scene.lights.forEach(function(light, i) { addLight(light, i); });
    }

    // Node-list format: { nodes: [...] } used by local templates
    if (Array.isArray(scene.nodes)) {
      scene.nodes.forEach(function(nodeInfo) {
        if (!nodeInfo || !nodeInfo.type) return;
        var type = String(nodeInfo.type).toLowerCase();
        if (type === 'camera') {
          configureCamera({
            position: nodeInfo.transform && nodeInfo.transform.position,
            target: nodeInfo.transform && nodeInfo.transform.target,
            fov: nodeInfo.props && nodeInfo.props.fov,
            near: nodeInfo.props && nodeInfo.props.near,
            far: nodeInfo.props && nodeInfo.props.far
          });
        } else if (type === 'light') {
          addLight(nodeInfo);
        } else {
          addObject({
            name: nodeInfo.id,
            geometry: nodeInfo.geometry,
            meshUrl: nodeInfo.meshUrl,
            material: nodeInfo.material,
            transform: nodeInfo.transform || {}
          });
        }
      });
    }

    // Environment block from node-list templates
    if (scene.environment) {
      setSceneAmbientColor(scene.environment.ambient || scene.environment.ambientColor);
      configureSky(scene.environment.skybox);
    }

    // Default camera when none was provided
    if (!cameraConfigured) {
      configureCamera({ position: [0, 5, 10], target: [0, 0, 0], fov: 60 });
    }

    try { LS.GlobalScene.requestFrame(); } catch (e) {}
    try { RenderModule.requestFrame && RenderModule.requestFrame(); } catch (e) {}
  }

  function readVec3(vec) {
    return toVec3(vec);
  }

  function nodeToObject(node) {
    var transform = node.transform || {};
    var obj = {
      id: node.uid,
      name: node.name,
      position: readVec3(transform.position),
      rotation: readVec3(transform.rotation),
      scale: readVec3(transform.scaling)
    };

    var primitive = node.getComponent && node.getComponent(LS.Components.GeometricPrimitive);
    if (primitive) {
      for (var key in PRIMITIVES) {
        if (LS.Components.GeometricPrimitive[PRIMITIVES[key]] === primitive.geometry) {
          obj.geometry = key;
          break;
        }
      }
      if (!obj.geometry) obj.geometry = 'cube';
      obj.size = primitive.size;
      obj.meshUrl = 'primitive:' + obj.geometry;
    } else {
      var renderer = node.getComponent && node.getComponent(LS.Components.MeshRenderer);
      if (renderer && renderer.mesh) {
        obj.meshUrl = renderer.mesh;
      }
    }

    var material = node.getComponent && node.getComponent(LS.Components.MeshRenderer);
    var mat = material && material.material;
    if (mat && mat.diffuse) {
      obj.material = { color: readVec3(mat.diffuse) };
      if (mat.emissive && mat.emissive[0] + mat.emissive[1] + mat.emissive[2] > 0) {
        obj.material.emissive = [mat.emissive[0], mat.emissive[1], mat.emissive[2]];
      }
    }

    return obj;
  }

  function nodeToLight(node) {
    var light = node.light;
    var typeName = 'point';
    if (light.type === LS.Light.DIRECTIONAL) typeName = 'directional';
    else if (light.type === LS.Light.SPOT) typeName = 'spot';

    var result = {
      id: node.uid,
      name: node.name,
      type: typeName,
      color: readVec3(light.color),
      intensity: light.intensity,
      position: readVec3(node.transform && node.transform.position)
    };
    if (light.angle !== undefined) result.angle = light.angle;
    return result;
  }

  function exportScene() {
    var scene = {
      version: 1,
      name: sceneId || 'scene',
      objects: [],
      lights: [],
      camera: null,
      materials: []
    };

    var root = LS.GlobalScene && LS.GlobalScene.root;
    if (!root) return scene;

    var children = root.getChildren ? root.getChildren() : (root._children || []);
    for (var i = 0; i < children.length; ++i) {
      var node = children[i];
      if (!node) continue;
      if (node.light) {
        scene.lights.push(nodeToLight(node));
      } else if (node.getComponent && node.getComponent(LS.Components.GeometricPrimitive)) {
        scene.objects.push(nodeToObject(node));
      }
    }

    try {
      var camera = RenderModule.getActiveCamera();
      if (camera) {
        scene.camera = {
          position: readVec3(camera.eye),
          target: readVec3(camera.center),
          fov: camera.fov || 60,
          near: camera.near,
          far: camera.far
        };
      }
    } catch (e) {}

    return scene;
  }

  function clearScene() {
    try { LS.GlobalScene.clear(); } catch (e) {}
  }

  function handleMessage(event) {
    if (!event || event.source === window) return;
    var data = event.data || {};
    if (!data || typeof data.type !== 'string') return;

    switch (data.type) {
      case 'load_scene':
        sceneId = data.sceneId || sceneId || 'scene';
        buildScene(data.scene || null);
        if (data.expectAck) postToParent({ type: 'scene_loaded', sceneId: sceneId });
        break;
      case 'request_scene':
        postToParent({ type: 'wonder_scene', sceneId: sceneId, scene: exportScene() });
        break;
      case 'add_primitive':
        if (data.primitive && typeof EditorModule !== 'undefined' && EditorModule.createPrimitive) {
          try {
            var constant = PRIMITIVES[String(data.primitive.type || '').toLowerCase()] || 'CUBE';
            var geometryValue = LS.Components.GeometricPrimitive[constant];
            if (geometryValue === undefined) geometryValue = LS.Components.GeometricPrimitive.CUBE;
            EditorModule.createPrimitive(
              { geometry: geometryValue, size: data.primitive.size || 1, subdivisions: 24 },
              data.primitive.type || 'cube'
            );
          } catch (e) {}
        }
        break;
      case 'clear_scene':
        clearScene();
        break;
      default:
        break;
    }
  }

  function scheduleSceneExport() {
    exportPending = true;
    if (exportTimer) return;
    exportTimer = setTimeout(function() {
      exportTimer = null;
      if (!exportPending) return;
      exportPending = false;
      postToParent({ type: 'scene_changed', sceneId: sceneId, scene: exportScene() });
    }, 800);
  }

  function onEditorReady() {
    ready = true;

    var origUserAction = CORE.userAction;
    CORE.userAction = function() {
      var result = origUserAction.apply(this, arguments);
      scheduleSceneExport();
      return result;
    };

    window.addEventListener('message', handleMessage);

    while (queuedMessages.length) {
      handleMessage(queuedMessages.shift());
    }

    var params = new URLSearchParams(window.location.search);
    sceneId = params.get('sceneId') || null;
    if (sceneId) {
      fetch('/api/scenes/' + encodeURIComponent(sceneId))
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(scene) {
          if (scene && !scene.error) buildScene(scene);
        })
        .catch(function() {});
    }

    postToParent({ type: 'wonder_ready', sceneId: sceneId });
  }

  // If a host message arrives before the editor has finished booting,
  // buffer it so nothing is lost.
  window.addEventListener('message', function(event) {
    if (ready || !event || event.source === window) return;
    var data = event.data || {};
    if (!data || typeof data.type !== 'string') return;
    if (data.type === 'load_scene' || data.type === 'request_scene' || data.type === 'clear_scene') {
      queuedMessages.push(event);
    }
  });

  var CORE_orig_launch = CORE && CORE.launch;
  if (CORE_orig_launch) {
    CORE.launch = function() {
      var result = CORE_orig_launch.apply(this, arguments);
      try {
        onEditorReady();
      } catch (e) {
        console.error('[WonderBridge] Failed to initialize after launch:', e);
      }
      return result;
    };
  }

  window.WonderBridge = {
    isReady: function() { return ready; },
    loadScene: buildScene,
    exportScene: exportScene,
    getSceneId: function() { return sceneId; }
  };
})();
