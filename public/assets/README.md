# Assets Folder

Static 3D assets for the library.

## Structure

```
assets/
├── meshes/      # GLB/GLTF 3D models
└── textures/   # Texture images (PNG, JPG)
```

## Usage

Drop `.glb` or `.gltf` files in `meshes/` and reference them in scene JSON:

```json
{
  "meshUrl": "/assets/meshes/my-model.glb"
}
```