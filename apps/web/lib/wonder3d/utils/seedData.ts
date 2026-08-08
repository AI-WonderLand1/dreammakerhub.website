import { AssetItem, Model3DType } from '../types';
import { INITIAL_ASSETS } from '../data/mockAssets';

/**
 * Mapping of 3D Model Types to sample GLB file paths and URLs
 */
export const SAMPLE_GLB_MAP: Record<Model3DType, string> = {
  mech: '/assets/models/mech.glb',
  crystal: '/assets/models/crystal.glb',
  hoverbike: '/assets/models/hoverbike.glb',
  skull: '/assets/models/skull.glb',
  helmet: '/assets/models/helmet.glb',
  pbr_sphere: '/assets/models/pbr_sphere.glb',
  portal_vfx: '/assets/models/portal_vfx.glb',
  cyber_kit: '/assets/models/cyber_kit.glb',
  flora: '/assets/models/flora.glb',
  station_core: '/assets/models/station_core.glb',
  gold_material: '/assets/models/gold_material.glb',
  rover: '/assets/models/rover.glb',
  ice_crystal: '/assets/models/ice_crystal.glb',
  quantum_core: '/assets/models/quantum_core.glb',
  hdri_sky: '/assets/models/hdri_sky.glb',
  mech_audio: '/assets/models/mech_audio.glb',
};

/**
 * High-quality verified Unsplash thumbnail image references mapped by model concept
 */
export const CONCEPT_THUMBNAIL_MAP: Record<Model3DType, string> = {
  mech: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  crystal: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
  hoverbike: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
  skull: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  helmet: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
  pbr_sphere: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
  portal_vfx: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
  cyber_kit: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
  flora: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80',
  station_core: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  gold_material: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80',
  rover: 'https://images.unsplash.com/photo-1614728894747-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  ice_crystal: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&auto=format&fit=crop&q=80',
  quantum_core: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=800&auto=format&fit=crop&q=80',
  hdri_sky: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
  mech_audio: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
};

/**
 * Data Seeding Utility
 * Seeds and updates asset objects with mapped GLB file paths and verified high-res thumbnails.
 */
export function seedAssets(rawAssets: AssetItem[]): AssetItem[] {
  return rawAssets.map((asset) => {
    const glbPath = SAMPLE_GLB_MAP[asset.modelType] || `/assets/models/${asset.modelType}.glb`;
    const verifiedThumbnail = CONCEPT_THUMBNAIL_MAP[asset.modelType] || asset.thumbnailImage;

    return {
      ...asset,
      glbFilePath: glbPath,
      glbUrl: glbPath,
      thumbnailImage: verifiedThumbnail,
    };
  });
}

/**
 * Returns the fully seeded initial asset list ready for application load.
 */
export function getSeededAssets(): AssetItem[] {
  return seedAssets(INITIAL_ASSETS);
}
