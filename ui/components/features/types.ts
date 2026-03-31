export type Extension = {
  id: string;
  name: string;
  description: string;
  price: number; // 0 = free
  installed: boolean;
  category?: "builder" | "ide" | "shared";
  version?: string;
  author?: string;
};

export type PurchaseResult = {
  success: boolean;
  message: string;
  extension?: Extension;
};

export type MarketplaceListResponse = {
  extensions: Extension[];
  total: number;
};
