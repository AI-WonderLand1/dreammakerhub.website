export type NavigationTab = 
  | 'explore'
  | 'marketplace'
  | 'categories'
  | 'creators'
  | 'collections'
  | 'upload'
  | 'create'
  | 'studio'
  | 'dashboard'
  | 'library'
  | 'favorites'
  | 'settings';

export type AssetCategory = 'models' | 'materials' | 'environments' | 'vfx' | 'audio' | 'building_kits' | 'characters' | 'vehicles' | 'weapons' | 'props' | 'nature' | 'architecture';

export type AssetFormat = '.GLTF' | '.FBX' | '.OBJ' | '.BLEND' | '.UNREAL' | '.UNITY' | '.4K_PBR' | '.USDZ' | '.STL';

export type Model3DType = 
  | 'mech'
  | 'crystal'
  | 'hoverbike'
  | 'skull'
  | 'helmet'
  | 'pbr_sphere'
  | 'portal_vfx'
  | 'cyber_kit'
  | 'flora'
  | 'station_core'
  | 'gold_material'
  | 'rover'
  | 'ice_crystal'
  | 'quantum_core'
  | 'hdri_sky'
  | 'mech_audio';

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  banner?: string;
  bio?: string;
  badge: string;
  rating: number;
  sales: number;
  followers?: number;
  following?: number;
  totalModels?: number;
  totalDownloads?: number;
  verified: boolean;
}

export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
}

export interface AssetSpecs {
  polyCount: number;
  vertexCount: number;
  meshCount: number;
  textureResolution: string;
  rigged: boolean;
  animated: boolean;
  pbrReady: boolean;
  uvUnwrapped: boolean;
  fileSizeMB: number;
  engineCompatibility: string[];
}

export interface AssetItem {
  id: string;
  title: string;
  description: string;
  category: AssetCategory;
  tags: string[];
  creator: Creator;
  price: number; // 0 = free
  rating: number;
  reviewsCount: number;
  downloadCount: number;
  likesCount: number;
  viewsCount: number;
  dateAdded: string;
  formats: AssetFormat[];
  modelType: Model3DType;
  thumbnailImage: string;
  glbFilePath?: string;
  glbUrl?: string;
  isAiGenerated?: boolean;
  featured?: boolean;
  trending?: boolean;
  specs: AssetSpecs;
  reviews: Review[];
  licenseType: 'Standard' | 'Editorial' | 'Commercial' | 'CC0' | 'Personal' | 'Extended';
  previewBgGradient: string;
  primaryColor: string;
  version?: string;
}

export interface CartItem {
  asset: AssetItem;
  license: 'Standard' | 'Commercial' | 'Enterprise';
  price: number;
}

export interface UserCollection {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  isPrivate?: boolean;
  creatorName?: string;
  assets: AssetItem[];
  createdAt: string;
}

export interface SceneObject {
  id: string;
  asset: AssetItem;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  name: string;
  visible: boolean;
}

export interface SceneData {
  id: string;
  title: string;
  description: string;
  objects: SceneObject[];
  createdAt: string;
}

export interface FilterState {
  search: string;
  category: AssetCategory | 'all';
  formats: AssetFormat[];
  maxPrice: number;
  freeOnly: boolean;
  aiOnly?: boolean;
  maxPolyCount: number;
  pbrOnly: boolean;
  riggedOnly: boolean;
  animatedOnly: boolean;
  sortBy: 'trending' | 'rating' | 'newest' | 'price_low' | 'price_high' | 'polyCount' | 'downloads' | 'likes';
}

export type ViewportRenderMode = 'textured' | 'wireframe' | 'clay' | 'normal' | 'xray' | 'uvgrid';
export type ViewportLighting = 'studio' | 'cyberpunk' | 'sunset' | 'void';

