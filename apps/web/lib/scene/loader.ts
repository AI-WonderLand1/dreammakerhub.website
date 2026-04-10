import * as pc from "playcanvas"
import { SceneFile } from "./schema"
import { loadSceneFromSupabase } from "./supabase-store"

export async function loadScene(app: pc.Application, sceneOrId: SceneFile | string) {
  // If it's a string, it's a sceneId - load from Supabase
  let scene: any = sceneOrId;
  
  if (typeof sceneOrId === "string") {
    const loaded = await loadSceneFromSupabase(sceneOrId);
    if (!loaded) {
      console.error("Scene not found:", sceneOrId);
      return;
    }
    scene = loaded;
  }

  // Create materials from the scene data
  const createMaterial = (matData: any): pc.StandardMaterial => {
    const material = new pc.StandardMaterial();
    if (matData.color) {
      material.diffuse = new pc.Color(matData.color[0], matData.color[1], matData.color[2]);
    }
    if (matData.metalness !== undefined) {
      material.metalness = matData.metalness;
    }
    if (matData.roughness !== undefined) {
      material.gloss = 1 - matData.roughness;
    }
    if (matData.emissive) {
      material.emissive = new pc.Color(matData.emissive[0], matData.emissive[1], matData.emissive[2]);
    }
    material.update();
    return material;
  };

  // Create objects
  if (scene.objects) {
    scene.objects.forEach((obj: any) => {
      const entity = new pc.Entity(obj.name || "object");
      
      // Add render component based on type
      let primitiveType = pc.PRIMITIVE_TRIANGLES;
      switch (obj.type) {
        case "box":
          primitiveType = pc.PRIMITIVE_BOX;
          break;
        case "sphere":
          primitiveType = pc.PRIMITIVE_SPHERE;
          break;
        case "cylinder":
          primitiveType = pc.PRIMITIVE_CYLINDER;
          break;
        case "plane":
          primitiveType = pc.PRIMITIVE_PLANE;
          break;
        case "capsule":
          primitiveType = pc.PRIMITIVE_CAPSULE;
          break;
        case "cone":
          primitiveType = pc.PRIMITIVE_CONE;
          break;
      }
      
      entity.addComponent("render", {
        type: primitiveType
      });
      
      // Apply position, rotation, scale
      if (obj.position) {
        entity.setPosition(obj.position[0], obj.position[1], obj.position[2]);
      }
      if (obj.rotation) {
        entity.setEulerAngles(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
      }
      if (obj.scale) {
        entity.setLocalScale(obj.scale[0], obj.scale[1], obj.scale[2]);
      }
      
      // Apply material
      if (obj.material) {
        const mat = createMaterial(obj.material);
        const render = entity.render as pc.RenderComponent;
        render.material = mat;
      }
      
      app.root.addChild(entity);
    });
  }

  // Create lights
  if (scene.lights) {
    scene.lights.forEach((light: any) => {
      const entity = new pc.Entity(light.type === "directional" ? "Directional Light" : "Point Light");
      
      entity.addComponent("light", {
        type: light.type || "directional",
        color: new pc.Color(light.color[0], light.color[1], light.color[2]),
        intensity: light.intensity || 1
      });
      
      if (light.position) {
        entity.setPosition(light.position[0], light.position[1], light.position[2]);
      }
      if (light.direction) {
        entity.setEulerAngles(
          Math.atan2(light.direction[1], Math.sqrt(light.direction[0]**2 + light.direction[2]**2)) * 180 / Math.PI,
          Math.atan2(light.direction[0], light.direction[2]) * 180 / Math.PI,
          0
        );
      }
      
      app.root.addChild(entity);
    });
  }

  // Create camera
  const cam = new pc.Entity("Camera");
  cam.addComponent("camera", {
    fov: scene.camera?.fov || 45,
    clearColor: new pc.Color(0.05, 0.05, 0.08)
  });
  
  if (scene.camera?.position) {
    cam.setPosition(scene.camera.position[0], scene.camera.position[1], scene.camera.position[2]);
  } else {
    cam.setPosition(0, 5, 10);
  }
  
  // Look at target
  const target = scene.camera?.target || [0, 0, 0];
  cam.lookAt(new pc.Vec3(target[0], target[1], target[2]));
  
  app.root.addChild(cam);
  app.cameras = [cam.camera as pc.CameraComponent];

  // Set sky/background
  if (scene.sky?.color) {
    const bg = scene.sky.color;
    cam.camera!.clearColor = new pc.Color(bg[0], bg[1], bg[2]);
  } else if (scene.sky?.type === "gradient") {
    // For gradient, we'd need a skybox - default to dark
    cam.camera!.clearColor = new pc.Color(0.05, 0.05, 0.1);
  }
}