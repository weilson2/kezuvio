import { randomUUID } from "node:crypto";
import {
  assertRole,
  integer,
  LabsError,
  type Action,
  type ProductModule,
} from "../demo-platform/index.ts";
import {
  finishes,
  floorMaterials,
  wallColors,
  type CatalogItem,
  type Design,
  type DesignItem,
  type InteriorState,
  type InteriorView,
} from "./model.ts";
import { placementIssue } from "./helpers.ts";
export * from "./model.ts";
export * from "./helpers.ts";
export const interiorLimits = {
  designs: 10,
  items: 30,
  history: 100,
  stateBytes: 256000,
  priceSen: 10000000,
} as const;
function fail(message: string): never {
  throw new LabsError(409, message);
}
function fields(args: Action["args"], keys: string[]) {
  if (
    Object.keys(args).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(args, key))
  )
    throw new LabsError(400, "Unexpected or missing action arguments.");
}
function text(value: unknown, label: string, max = 80) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new LabsError(400, `${label} must contain 1–${max} characters.`);
  return value.trim();
}
function choice<T extends string>(
  value: unknown,
  values: readonly T[],
  label: string,
): T {
  if (typeof value !== "string" || !values.includes(value as T))
    throw new LabsError(400, `Choose a valid ${label}.`);
  return value as T;
}
function find<T extends { id: string }>(
  rows: T[],
  id: unknown,
  label: string,
): T {
  const found = rows.find((row) => row.id === text(id, `${label} ID`));
  if (!found) throw new LabsError(404, `${label} not found in this workspace.`);
  return found;
}
function current(state: InteriorState, args: Action["args"]) {
  const design = find(state.designs, args.id, "Design");
  if (design.version !== integer(args.version, "Design version", 1))
    fail("This design changed. Refresh before editing.");
  return design;
}
function roomSize(args: Action["args"]) {
  return {
    widthCm: integer(args.widthCm, "Room width centimetres", 200, 1500),
    depthCm: integer(args.depthCm, "Room depth centimetres", 200, 1500),
    heightCm: integer(args.heightCm, "Room height centimetres", 200, 500),
  };
}
function sized(product: CatalogItem, args: Action["args"]) {
  return {
    widthCm: integer(
      args.widthCm,
      "Furniture width centimetres",
      Math.ceil(product.widthCm / 2),
      product.widthCm * 2,
    ),
    depthCm: integer(
      args.depthCm,
      "Furniture depth centimetres",
      Math.ceil(product.depthCm / 2),
      product.depthCm * 2,
    ),
    heightCm: integer(
      args.heightCm,
      "Furniture height centimetres",
      Math.ceil(product.heightCm / 2),
      product.heightCm * 2,
    ),
  };
}
function validateRoom(design: Design) {
  for (const item of design.items) {
    const issue = placementIssue(design, item, item.id);
    if (issue) fail(issue);
  }
}
function touch(design: Design, now: number) {
  design.version++;
  design.savedAt = new Date(now).toISOString();
}
function newDesign(
  name: string,
  preset: Pick<Design, "widthCm" | "depthCm" | "heightCm">,
  now: number,
): Design {
  return {
    id: randomUUID(),
    version: 1,
    name,
    ...preset,
    wallColor: "Linen",
    floorMaterial: "Oak",
    items: [],
    createdAt: new Date(now).toISOString(),
    savedAt: new Date(now).toISOString(),
  };
}
function apply(state: InteriorState, action: Action, now: number) {
  const args = action.args;
  switch (action.type) {
    case "design.create": {
      fields(args, ["name", "presetId"]);
      if (state.designs.length >= interiorLimits.designs)
        throw new LabsError(
          429,
          "Design limit reached. Remove a design or reset the demo.",
        );
      const preset = find(state.presets, args.presetId, "Room preset");
      const design = newDesign(
        text(args.name, "Design name"),
        {
          widthCm: preset.widthCm,
          depthCm: preset.depthCm,
          heightCm: preset.heightCm,
        },
        now,
      );
      state.designs.push(design);
      state.selectedDesignId = design.id;
      return "New room design created and saved.";
    }
    case "design.load": {
      fields(args, ["id"]);
      state.selectedDesignId = find(state.designs, args.id, "Design").id;
      return "Saved room design loaded.";
    }
    case "design.save": {
      fields(args, ["id", "version", "name"]);
      const design = current(state, args);
      design.name = text(args.name, "Design name");
      touch(design, now);
      return "Room design saved.";
    }
    case "design.update": {
      fields(args, [
        "id",
        "version",
        "name",
        "widthCm",
        "depthCm",
        "heightCm",
        "wallColor",
        "floorMaterial",
      ]);
      const design = current(state, args);
      Object.assign(design, {
        name: text(args.name, "Design name"),
        ...roomSize(args),
        wallColor: choice(args.wallColor, wallColors, "wall colour"),
        floorMaterial: choice(
          args.floorMaterial,
          floorMaterials,
          "floor material",
        ),
      });
      validateRoom(design);
      touch(design, now);
      return "Room dimensions and surfaces saved.";
    }
    case "design.duplicate": {
      fields(args, ["id", "version", "name"]);
      const design = current(state, args);
      if (state.designs.length >= interiorLimits.designs)
        throw new LabsError(
          429,
          "Design limit reached. Remove a design or reset the demo.",
        );
      const duplicate = {
        ...structuredClone(design),
        id: randomUUID(),
        version: 1,
        name: text(args.name, "Design name"),
        createdAt: new Date(now).toISOString(),
        savedAt: new Date(now).toISOString(),
        items: design.items.map((item) => ({ ...item, id: randomUUID() })),
      };
      state.designs.push(duplicate);
      state.selectedDesignId = duplicate.id;
      return "Independent room design copy saved.";
    }
    case "design.remove": {
      fields(args, ["id", "version"]);
      const design = current(state, args);
      if (state.designs.length === 1)
        fail("Keep at least one room design. Use reset to restore the sample.");
      state.designs = state.designs.filter((row) => row.id !== design.id);
      if (state.selectedDesignId === design.id)
        state.selectedDesignId = state.designs[0].id;
      return "Room design removed from this workspace.";
    }
    case "item.add": {
      fields(args, ["id", "version", "catalogId", "xCm", "zCm"]);
      const design = current(state, args),
        product = find(state.catalog, args.catalogId, "Furniture");
      if (design.items.length >= interiorLimits.items)
        throw new LabsError(429, "Furniture limit reached for this design.");
      const item: DesignItem = {
        id: randomUUID(),
        catalogId: product.id,
        xCm: integer(args.xCm, "X centimetres", 0, 1500),
        zCm: integer(args.zCm, "Z centimetres", 0, 1500),
        rotationDeg: 0,
        widthCm: product.widthCm,
        depthCm: product.depthCm,
        heightCm: product.heightCm,
        finish: "Oak",
      };
      const issue = placementIssue(design, item);
      if (issue) fail(issue);
      design.items.push(item);
      touch(design, now);
      return `${product.name} inserted and saved.`;
    }
    case "item.update": {
      fields(args, [
        "id",
        "version",
        "itemId",
        "xCm",
        "zCm",
        "rotationDeg",
        "widthCm",
        "depthCm",
        "heightCm",
        "finish",
      ]);
      const design = current(state, args),
        item = find(design.items, args.itemId, "Furniture instance"),
        product = find(state.catalog, item.catalogId, "Furniture");
      const rotationDeg = integer(args.rotationDeg, "Rotation degrees", 0, 270);
      if (![0, 90, 180, 270].includes(rotationDeg))
        throw new LabsError(
          400,
          "Rotate in quarter turns: 0,90,180 or270 degrees.",
        );
      Object.assign(item, {
        ...sized(product, args),
        xCm: integer(args.xCm, "X centimetres", 0, 1500),
        zCm: integer(args.zCm, "Z centimetres", 0, 1500),
        rotationDeg,
        finish: choice(args.finish, finishes, "furniture finish"),
      });
      const issue = placementIssue(design, item, item.id);
      if (issue) fail(issue);
      touch(design, now);
      return "Furniture position, size, rotation and finish saved.";
    }
    case "item.remove": {
      fields(args, ["id", "version", "itemId"]);
      const design = current(state, args),
        item = find(design.items, args.itemId, "Furniture instance");
      design.items = design.items.filter((row) => row.id !== item.id);
      touch(design, now);
      return "Furniture instance removed.";
    }
    case "pricing.update": {
      fields(args, ["version", "catalogId", "unitPriceSen"]);
      if (integer(args.version, "Pricing version", 1) !== state.pricingVersion)
        fail("Demo pricing changed. Refresh before editing.");
      const product = find(state.catalog, args.catalogId, "Furniture");
      product.unitPriceSen = integer(
        args.unitPriceSen,
        "Demo unit price sen",
        1,
        interiorLimits.priceSen,
      );
      state.pricingVersion++;
      return "Illustrative catalogue price updated for current and saved designs.";
    }
    default:
      throw new LabsError(400, "Unknown room-design action.");
  }
}
export function seedInterior(now: number): InteriorState {
  const catalog: CatalogItem[] = [
    {
      id: "sofa",
      name: "Rimbun sofa",
      kind: "sofa",
      widthCm: 180,
      depthCm: 85,
      heightCm: 80,
      unitPriceSen: 180000,
    },
    {
      id: "coffee-table",
      name: "Suri coffee table",
      kind: "table",
      widthCm: 100,
      depthCm: 60,
      heightCm: 45,
      unitPriceSen: 45000,
    },
    {
      id: "chair",
      name: "Bayu lounge chair",
      kind: "chair",
      widthCm: 70,
      depthCm: 75,
      heightCm: 85,
      unitPriceSen: 65000,
    },
    {
      id: "shelf",
      name: "Meranti shelf",
      kind: "shelf",
      widthCm: 100,
      depthCm: 35,
      heightCm: 180,
      unitPriceSen: 55000,
    },
    {
      id: "bed",
      name: "Linen platform bed",
      kind: "bed",
      widthCm: 160,
      depthCm: 200,
      heightCm: 90,
      unitPriceSen: 220000,
    },
    {
      id: "lamp",
      name: "Cempaka floor lamp",
      kind: "lamp",
      widthCm: 40,
      depthCm: 40,
      heightCm: 160,
      unitPriceSen: 18000,
    },
    {
      id: "cabinet",
      name: "Pandan cabinet",
      kind: "cabinet",
      widthCm: 120,
      depthCm: 45,
      heightCm: 85,
      unitPriceSen: 85000,
    },
    {
      id: "desk",
      name: "Damar writing desk",
      kind: "desk",
      widthCm: 120,
      depthCm: 60,
      heightCm: 75,
      unitPriceSen: 75000,
    },
  ];
  const design = newDesign(
    "Fictional studio lounge",
    { widthCm: 500, depthCm: 400, heightCm: 280 },
    now,
  );
  design.id = "design-1";
  design.items = [
    {
      id: "item-1",
      catalogId: "sofa",
      xCm: 30,
      zCm: 30,
      rotationDeg: 0,
      widthCm: 180,
      depthCm: 85,
      heightCm: 80,
      finish: "Oak",
    },
    {
      id: "item-2",
      catalogId: "coffee-table",
      xCm: 70,
      zCm: 180,
      rotationDeg: 0,
      widthCm: 100,
      depthCm: 60,
      heightCm: 45,
      finish: "Oak",
    },
    {
      id: "item-3",
      catalogId: "lamp",
      xCm: 410,
      zCm: 30,
      rotationDeg: 0,
      widthCm: 40,
      depthCm: 40,
      heightCm: 160,
      finish: "Oak",
    },
  ];
  return {
    catalog,
    pricingVersion: 1,
    presets: [
      {
        id: "lounge",
        name: "Lounge",
        widthCm: 500,
        depthCm: 400,
        heightCm: 280,
      },
      {
        id: "bedroom",
        name: "Bedroom",
        widthCm: 450,
        depthCm: 400,
        heightCm: 280,
      },
      {
        id: "studio",
        name: "Studio",
        widthCm: 600,
        depthCm: 450,
        heightCm: 300,
      },
    ],
    designs: [design],
    selectedDesignId: design.id,
    history: [],
  };
}
export function createInteriorModule(
  clock: () => number = Date.now,
): ProductModule<InteriorState> {
  return {
    id: "interior-3d",
    seed: () => seedInterior(clock()),
    reduce(state, action, actor) {
      assertRole(
        actor.role,
        action.type === "pricing.update"
          ? ["manager"]
          : ["customer", "manager"],
      );
      const next = structuredClone(state),
        now = clock(),
        detail = apply(next, action, now);
      next.history.unshift({
        id: randomUUID(),
        at: new Date(now).toISOString(),
        event: action.type,
        detail,
      });
      next.history = next.history.slice(0, interiorLimits.history);
      if (
        Buffer.byteLength(JSON.stringify(next), "utf8") >
        interiorLimits.stateBytes
      )
        throw new LabsError(
          429,
          "Room workspace size limit reached. Remove a design or reset.",
        );
      return next;
    },
    project(state, actor): InteriorView {
      return {
        ...structuredClone(state),
        history: actor.role === "manager" ? structuredClone(state.history) : [],
        canEdit: actor.role === "customer" || actor.role === "manager",
        canPrice: actor.role === "manager",
        asOf: new Date(clock()).toISOString(),
      };
    },
  };
}
export const interiorModule = createInteriorModule();
