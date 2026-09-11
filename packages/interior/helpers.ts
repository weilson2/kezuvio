import {
  finishes,
  type CatalogItem,
  type Design,
  type DesignItem,
  type DesignQuote,
} from "./model.ts";

/** Centimetre geometry helpers shared by server validation and client feedback. */
export function itemFootprint(
  item: Pick<DesignItem, "widthCm" | "depthCm" | "rotationDeg">,
) {
  return item.rotationDeg === 90 || item.rotationDeg === 270
    ? { widthCm: item.depthCm, depthCm: item.widthCm }
    : { widthCm: item.widthCm, depthCm: item.depthCm };
}
export function placementIssue(
  design: Pick<Design, "widthCm" | "depthCm" | "heightCm" | "items">,
  item: DesignItem,
  ignoreItemId?: string,
): string | null {
  if (
    ![item.xCm, item.zCm, item.widthCm, item.depthCm, item.heightCm].every(
      Number.isSafeInteger,
    ) ||
    ![0, 90, 180, 270].includes(item.rotationDeg)
  )
    return "Use whole centimetres and quarter-turn rotations.";
  if (
    item.xCm < 0 ||
    item.zCm < 0 ||
    item.widthCm <= 0 ||
    item.depthCm <= 0 ||
    item.heightCm <= 0
  )
    return "Furniture positions and dimensions must be positive within the room.";
  const bounds = itemFootprint(item);
  if (
    item.xCm + bounds.widthCm > design.widthCm ||
    item.zCm + bounds.depthCm > design.depthCm ||
    item.heightCm > design.heightCm
  )
    return "Furniture must stay inside the room's floor and height boundaries.";
  for (const other of design.items) {
    if (other.id === ignoreItemId) continue;
    const footprint = itemFootprint(other);
    if (
      item.xCm < other.xCm + footprint.widthCm &&
      other.xCm < item.xCm + bounds.widthCm &&
      item.zCm < other.zCm + footprint.depthCm &&
      other.zCm < item.zCm + bounds.depthCm
    )
      return "Furniture floor footprints overlap. Move it to a clear space.";
  }
  return null;
}
/** All positive rational amounts round half up exactly once to integer sen. */
export function roundSenRatio(
  numerator: number | bigint,
  denominator: number | bigint,
) {
  if (
    (typeof numerator === "number" && !Number.isSafeInteger(numerator)) ||
    (typeof denominator === "number" && !Number.isSafeInteger(denominator))
  )
    throw new Error("Pricing ratios require safe integer operands.");
  const n = BigInt(numerator),
    d = BigInt(denominator);
  if (n < 0n || d <= 0n) throw new Error("Positive pricing ratio required.");
  const result = Number((n * 2n + d) / (d * 2n));
  if (!Number.isSafeInteger(result))
    throw new Error("Price exceeds a safe integer amount.");
  return result;
}
export function quoteDesign(
  design: Design,
  catalog: CatalogItem[],
): DesignQuote {
  const lines = design.items.map((item) => {
    const product = catalog.find((product) => product.id === item.catalogId);
    if (!product || !finishes.includes(item.finish))
      throw new Error(
        "Furniture references an unavailable catalogue item or finish.",
      );
    const percent =
      item.finish === "Walnut" ? 110 : item.finish === "White" ? 105 : 100;
    const amountSen = roundSenRatio(
      BigInt(product.unitPriceSen) *
        BigInt(item.widthCm) *
        BigInt(item.depthCm) *
        BigInt(percent),
      BigInt(product.widthCm) * BigInt(product.depthCm) * 100n,
    );
    return {
      itemId: item.id,
      name: product.name,
      finish: item.finish,
      amountSen,
    };
  });
  const rate =
    design.floorMaterial === "Oak"
      ? 6500
      : design.floorMaterial === "Terrazzo"
        ? 8500
        : 4500;
  const furnitureSen = lines.reduce((sum, line) => sum + line.amountSen, 0);
  const floorSen = roundSenRatio(
    BigInt(design.widthCm) * BigInt(design.depthCm) * BigInt(rate),
    10000n,
  );
  const wallsSen = roundSenRatio(
    2n *
      BigInt(design.widthCm + design.depthCm) *
      BigInt(design.heightCm) *
      750n,
    10000n,
  );
  return {
    lines,
    furnitureSen,
    floorSen,
    wallsSen,
    totalSen: furnitureSen + floorSen + wallsSen,
    itemCount: lines.length,
  };
}
