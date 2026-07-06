export type AssetType = 'model' | 'texture' | 'environment';

export interface LibraryAsset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  description: string;
  category: string;
  thumbnail?: string;
}
