export const wallColors = ["Linen", "Sage", "Clay", "Midnight"] as const;
export const floorMaterials = ["Oak", "Terrazzo", "Concrete"] as const;
export const finishes = ["Oak", "Walnut", "White"] as const;
export type WallColor = (typeof wallColors)[number];
export type FloorMaterial = (typeof floorMaterials)[number];
export type Finish = (typeof finishes)[number];
export type CatalogItem = {
  id: string;
  name: string;
  kind:
    "sofa" | "table" | "chair" | "shelf" | "bed" | "lamp" | "cabinet" | "desk";
  widthCm: number;
  depthCm: number;
  heightCm: number;
  unitPriceSen: number;
};
export type RoomPreset = {
  id: string;
  name: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
};
export type DesignItem = {
  id: string;
  catalogId: string;
  xCm: number;
  zCm: number;
  rotationDeg: 0 | 90 | 180 | 270;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  finish: Finish;
};
export type Design = {
  id: string;
  version: number;
  name: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  wallColor: WallColor;
  floorMaterial: FloorMaterial;
  items: DesignItem[];
  createdAt: string;
  savedAt: string;
};
export type InteriorState = {
  catalog: CatalogItem[];
  pricingVersion: number;
  presets: RoomPreset[];
  designs: Design[];
  selectedDesignId: string;
  history: { id: string; at: string; event: string; detail: string }[];
};
export type DesignQuote = {
  lines: { itemId: string; name: string; finish: Finish; amountSen: number }[];
  furnitureSen: number;
  floorSen: number;
  wallsSen: number;
  totalSen: number;
  itemCount: number;
};
export type InteriorView = InteriorState & {
  canEdit: boolean;
  canPrice: boolean;
  asOf: string;
};
