# M7 Interior 3D domain / client contract

`interiorModule` / `createInteriorModule` from server `packages/interior/index.ts`, product `interior-3d`. Client imports types/constants from `model.ts`, pure `quoteDesign`, `itemFootprint`, `placementIssue` from `helpers.ts`. Do not import server index in Client Components because it uses node:crypto.

Model is published in `packages/interior/model.ts`. **Every dimension/position is integer centimetres**. Convert /100 to scene metres. `DesignItem.xCm,zCm` locate the floor footprint's minimum corner from room left/front, independent of rotation. `rotationDeg` is exactly 0,90,180,270; footprint width/depth swap at 90/270. For scene centre use xCm+footprint.widthCm/2 and zCm+footprint.depthCm/2; height centre is heightCm/2. Numeric controls are sufficient accessible manipulation. Floor footprints cannot overlap (touching edges allowed), must lie within room bounds, and height cannot exceed room height. No vertical stacking or complex polygon collisions.

State: catalog (8 fictional primitive models), pricingVersion, presets, designs, selectedDesignId, bounded history. View adds canEdit/canPrice/asOf. Customer and Manager can edit visitor-workspace designs; Viewer is read-only. Manager alone changes demo catalog prices. These remain simulated roles within the server-derived private visitor workspace, not real authentication.

Every edit is transactionally persisted immediately (reload recovery). `design.save` additionally names/marks the explicit saved version with savedAt; it is not a separate unsaved local draft system. UI must say changes autosave. Selected design = `view.designs.find(d=>d.id===view.selectedDesignId)`. No null selected design; retain at least one design.

| Action             | Exact args                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design.create`    | `{name,presetId}` creates empty preset room, selects it                                                                                                |
| `design.load`      | `{id}` selects existing saved design                                                                                                                   |
| `design.save`      | `{id,version,name}` explicit save/rename marker                                                                                                        |
| `design.update`    | `{id,version,name,widthCm,depthCm,heightCm,wallColor,floorMaterial}` validates all existing items against new room; failed shrink preserves prior room |
| `design.duplicate` | `{id,version,name}` deep copies room/items with distinct IDs; selects copy                                                                             |
| `design.remove`    | `{id,version}` refuses deleting last design; selects first remaining                                                                                   |
| `item.add`         | `{id,version,catalogId,xCm,zCm}` default dimensions/rotation/finish; version refers to DESIGN                                                          |
| `item.update`      | `{id,version,itemId,xCm,zCm,rotationDeg,widthCm,depthCm,heightCm,finish}` validates complete transform; version refers to DESIGN                       |
| `item.remove`      | `{id,version,itemId}`                                                                                                                                  |
| `pricing.update`   | `{version,catalogId,unitPriceSen}` expected pricingVersion; Manager only                                                                               |

Room bounds: width/depth200–1500cm, height200–500cm. Item dimensions each 50–200% of catalogue default, integercm. Up to10 designs,30 items/design; catalogue8,presets3. Names1–80chars. Unit prices1–10,000,000sen. No identity, workspace, generation or role accepted in action args. Repository handles reset/idempotency/isolation.

`itemFootprint(item)` returns `{widthCm,depthCm}`. `placementIssue(design,item,ignoreItemId?)` returns a readable string or null, checking room bounds/height and axis-aligned footprint collision. `quoteDesign(design,catalog)` returns DesignQuote. Furniture uses catalog base price × configured footprint/default footprint × finish premium (Oak0%, Walnut10%, White5%), one half-up integer-sen round per item. Floor material rates per square metre: Oak6500sen, Terrazzo8500sen, Concrete4500sen. Wall finish750sen/sqm over four gross walls (no window/door deductions). Surface amounts round half up once from integercm²/10,000. Quantity = count of inserted instances. Prices use current demo rates, including existing saved designs; no real quotations.

Seed selected `design-1` name “Fictional studio lounge”, room500×400×280, Linen/Oak, sofa(180×85×80 at30,30), coffee-table(100×60×45 at70,180), lamp(40×40×160 at410,30). IDs item-1,item-2,item-3. Catalogue IDs sofa,coffee-table,chair,shelf,bed,lamp,cabinet,desk. Preset IDs lounge500×400×280,bedroom450×400×280,studio600×450×300. All assets are original primitive geometry, no external models/textures. Screenshot export is a client operation; handle unsupported WebGL/export errors without mutating server state.
