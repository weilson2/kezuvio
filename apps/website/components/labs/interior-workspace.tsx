"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Badge, Button, Field } from "@kezuvio/ui";
import { Empty, Stats } from "../demos/shared";
import { LabShell, useLabWorkspace, type LabWorkspace } from "./platform-shell";
import {
  finishes,
  floorMaterials,
  wallColors,
  type CatalogItem,
  type Design,
  type DesignItem,
  type InteriorView,
} from "../../../../packages/interior/model";
import {
  itemFootprint,
  placementIssue,
  quoteDesign,
} from "../../../../packages/interior/helpers";
import type { CameraActions, Capture } from "./interior-scene";
import "./interior.css";

const Scene = dynamic(() => import("./interior-scene"), {
  ssr: false,
  loading: () => (
    <div className="interior-scene-fallback" role="status">
      <h3>Loading 3D room…</h3>
      <p>Preparing the original furniture geometry.</p>
    </div>
  ),
});
const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});
const rm = (sen: number) => money.format(sen / 100);
const read = (form: FormData, name: string) => String(form.get(name) ?? "");
const busy = (workspace: LabWorkspace) =>
  workspace.busy || workspace.needsRefresh;
const views = ["Design", "Furniture", "Saved layouts", "Pricing"] as const;
const designIntroduction =
  "Shape a fictional room with original furniture. All accepted changes autosave in this workspace; design totals use illustrative MYR pricing.";
type Area = (typeof views)[number];
type Props = { view: InteriorView; design: Design; workspace: LabWorkspace };
function sen(value: string) {
  const input = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(input))
    throw new Error("Enter an RM amount with at most two decimal places.");
  const [whole, part = ""] = input.split(".");
  const result = Number(whole) * 100 + Number(part.padEnd(2, "0"));
  if (!Number.isSafeInteger(result))
    throw new Error("Enter a smaller RM amount.");
  return result;
}
function Choice({
  label,
  name,
  value,
  defaultValue,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
      >
        {children}
      </select>
    </div>
  );
}
function Input({
  label,
  name,
  value,
  defaultValue,
  onChange,
  min,
  max,
  step,
  type = "text",
}: {
  label: string;
  name: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  type?: string;
}) {
  const id = useId();
  return (
    <Field
      id={id}
      name={name}
      label={label}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      required
      type={type}
      min={min}
      max={max}
      step={step}
    />
  );
}
function Form({
  title,
  workspace,
  submit,
  children,
  button,
}: {
  title: string;
  workspace: LabWorkspace;
  submit: (form: FormData) => Promise<unknown>;
  children: ReactNode;
  button: string;
}) {
  const id = useId();
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await submit(new FormData(event.currentTarget));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Check the design controls.",
      );
    }
  }
  return (
    <form
      className="demo-panel interior-card"
      onSubmit={save}
      aria-labelledby={id}
    >
      <h3 id={id}>{title}</h3>
      <fieldset className="interior-fields" disabled={busy(workspace)}>
        {children}
      </fieldset>
      {error && (
        <p role="alert" className="interior-error">
          {error}
        </p>
      )}
      <div className="labs-actions">
        <Button type="submit" disabled={busy(workspace)}>
          {button}
        </Button>
      </div>
    </form>
  );
}
function Fallback({ failed = false }: { failed?: boolean }) {
  return (
    <div className="interior-scene-fallback" role="status">
      <h3>
        {failed ? "3D preview could not render" : "3D preview unavailable"}
      </h3>
      <p>
        {failed
          ? "The graphics device could not finish this scene."
          : "This browser does not provide a working WebGL context."}{" "}
        Numeric room and furniture controls, pricing and saved layouts remain
        available.
      </p>
    </div>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback failed /> : this.props.children;
  }
}
function SceneArea({
  design,
  view,
  selectedId,
  onSelect,
}: {
  design: Design;
  view: InteriorView;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [error, setError] = useState("");
  const captureRef = useRef<Capture | null>(null);
  const cameraRef = useRef<CameraActions | null>(null);
  useEffect(() => {
    try {
      const probe = document.createElement("canvas");
      const context = probe.getContext("webgl2") || probe.getContext("webgl");
      setSupported(!!context);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setSupported(false);
    }
  }, []);
  const captureReady = useCallback((capture: Capture | null) => {
    captureRef.current = capture;
    setReady(!!capture);
  }, []);
  const cameraReady = useCallback((camera: CameraActions | null) => {
    cameraRef.current = camera;
  }, []);
  async function screenshot() {
    setError("");
    try {
      const blob = await captureRef.current?.();
      if (!blob)
        throw new Error(
          "The browser could not export this scene. Try again after the preview has rendered.",
        );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "kezuvio-room-design.png";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to export this scene.",
      );
    }
  }
  return (
    <section aria-label="Room preview">
      <div className="interior-toolbar">
        <h3>Interactive room</h3>
        <div className="labs-actions">
          <Button
            variant="secondary"
            onClick={() => setCameraKey(cameraKey + 1)}
            disabled={!ready}
          >
            Reset camera
          </Button>
          <Button
            variant="secondary"
            onClick={() => void screenshot()}
            disabled={!ready}
          >
            Export screenshot
          </Button>
        </div>
      </div>
      <div className="interior-scene-frame" data-testid="interior-scene">
        {supported === null ? (
          <div className="interior-scene-fallback" role="status">
            Checking 3D support…
          </div>
        ) : !supported ? (
          <Fallback />
        ) : (
          <SceneBoundary>
            <Scene
              design={design}
              catalog={view.catalog}
              selectedId={selectedId}
              onSelect={onSelect}
              onCaptureReady={captureReady}
              onCameraReady={cameraReady}
              cameraKey={cameraKey}
            />
          </SceneBoundary>
        )}
      </div>
      <div className="labs-actions" style={{ marginTop: 12 }}>
        <Button
          variant="secondary"
          disabled={!ready}
          onClick={() => cameraRef.current?.orbit(-15)}
        >
          Orbit left
        </Button>
        <Button
          variant="secondary"
          disabled={!ready}
          onClick={() => cameraRef.current?.orbit(15)}
        >
          Orbit right
        </Button>
        <Button
          variant="secondary"
          disabled={!ready}
          onClick={() => cameraRef.current?.zoom(0.8)}
        >
          Zoom in
        </Button>
        <Button
          variant="secondary"
          disabled={!ready}
          onClick={() => cameraRef.current?.zoom(1.25)}
        >
          Zoom out
        </Button>
      </div>
      <p className="interior-scene-caption">
        Drag to orbit, scroll or pinch to zoom, or use the camera buttons.
        Select furniture in the scene or in the item list. Geometry is original
        and uses no downloaded models.
      </p>
      {error && (
        <p className="interior-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
function Cost({ design, view }: { design: Design; view: InteriorView }) {
  const quote = quoteDesign(design, view.catalog);
  return (
    <section
      className="demo-panel interior-card"
      aria-label="Illustrative design estimate"
    >
      <h3>Illustrative design estimate</h3>
      <strong className="interior-price" data-testid="interior-total">
        {rm(quote.totalSen)}
      </strong>
      <p className="interior-muted">
        {quote.itemCount} furniture instances · configurable fictional rates,
        not a real quotation.
      </p>
      <ul className="interior-cost-lines">
        {quote.lines.map((line) => (
          <li key={line.itemId}>
            <span>
              {line.name} · {line.finish}
            </span>
            <strong>{rm(line.amountSen)}</strong>
          </li>
        ))}
        <li>
          <span>Floor material</span>
          <strong>{rm(quote.floorSen)}</strong>
        </li>
        <li>
          <span>Gross wall finish</span>
          <strong>{rm(quote.wallsSen)}</strong>
        </li>
      </ul>
      <p className="interior-muted">
        Furniture scales with configured floor footprint; Walnut adds 10%, White
        5%. Surface estimates use whole room dimensions, without deductions for
        doors or windows.
      </p>
    </section>
  );
}
function RoomEditor({
  view,
  design,
  workspace,
  onPreview,
}: Props & { onPreview: (design: Design | null) => void }) {
  const [draft, setDraft] = useState(design);
  function update<K extends keyof Design>(key: K, value: Design[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onPreview(next);
  }
  const roomValid =
    [draft.widthCm, draft.depthCm].every(
      (size) => Number.isSafeInteger(size) && size >= 200 && size <= 1500,
    ) &&
    Number.isSafeInteger(draft.heightCm) &&
    draft.heightCm >= 200 &&
    draft.heightCm <= 500;
  const issue = !roomValid
    ? "Use whole room dimensions: width/depth 200–1500 cm and height 200–500 cm."
    : draft.items
        .map((item) => placementIssue(draft, item, item.id))
        .find(Boolean);
  return (
    <Form
      title="Room dimensions & surfaces"
      workspace={workspace}
      button="Apply room changes"
      submit={async () => {
        if (issue) throw new Error(issue);
        const result = await workspace.act(
          "design.update",
          {
            id: design.id,
            version: design.version,
            name: draft.name,
            widthCm: draft.widthCm,
            depthCm: draft.depthCm,
            heightCm: draft.heightCm,
            wallColor: draft.wallColor,
            floorMaterial: draft.floorMaterial,
          },
          "Room changes saved.",
        );
        if (result) onPreview(null);
        return result;
      }}
    >
      <Input
        label="Room width (cm)"
        name="width"
        type="number"
        min={200}
        max={1500}
        step={1}
        value={draft.widthCm}
        onChange={(value) => update("widthCm", Number(value))}
      />
      <Input
        label="Room depth (cm)"
        name="depth"
        type="number"
        min={200}
        max={1500}
        step={1}
        value={draft.depthCm}
        onChange={(value) => update("depthCm", Number(value))}
      />
      <Input
        label="Room height (cm)"
        name="height"
        type="number"
        min={200}
        max={500}
        step={1}
        value={draft.heightCm}
        onChange={(value) => update("heightCm", Number(value))}
      />
      <Choice
        label="Wall colour"
        name="wall"
        value={draft.wallColor}
        onChange={(value) => update("wallColor", value as Design["wallColor"])}
      >
        {wallColors.map((color) => (
          <option key={color}>{color}</option>
        ))}
      </Choice>
      <Choice
        label="Floor material"
        name="floor"
        value={draft.floorMaterial}
        onChange={(value) =>
          update("floorMaterial", value as Design["floorMaterial"])
        }
      >
        {floorMaterials.map((material) => (
          <option key={material}>{material}</option>
        ))}
      </Choice>
      <p className="interior-muted">
        Controls preview immediately. Apply to save the room; a failed shrink
        retains the saved layout.
      </p>
      {issue && (
        <p className="interior-feedback" role="status">
          {issue}
        </p>
      )}
    </Form>
  );
}
function ObjectEditor({
  design,
  item,
  workspace,
  onPreview,
  view,
}: Props & { item: DesignItem; onPreview: (design: Design | null) => void }) {
  const [draft, setDraft] = useState(item);
  const catalog = view.catalog.find((model) => model.id === item.catalogId)!;
  function update<K extends keyof DesignItem>(key: K, value: DesignItem[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onPreview({
      ...design,
      items: design.items.map((row) => (row.id === item.id ? next : row)),
    });
  }
  const issue = placementIssue(design, draft, item.id);
  return (
    <Form
      title={`Configure ${catalog.name}`}
      workspace={workspace}
      button="Apply furniture changes"
      submit={async () => {
        if (issue) throw new Error(issue);
        const result = await workspace.act(
          "item.update",
          {
            id: design.id,
            version: design.version,
            itemId: item.id,
            xCm: draft.xCm,
            zCm: draft.zCm,
            rotationDeg: draft.rotationDeg,
            widthCm: draft.widthCm,
            depthCm: draft.depthCm,
            heightCm: draft.heightCm,
            finish: draft.finish,
          },
          "Furniture configuration saved.",
        );
        if (result) onPreview(null);
        return result;
      }}
    >
      <Input
        label="Position X (cm)"
        name="x"
        type="number"
        min={0}
        step={1}
        value={draft.xCm}
        onChange={(value) => update("xCm", Number(value))}
      />
      <Input
        label="Position Z (cm)"
        name="z"
        type="number"
        min={0}
        step={1}
        value={draft.zCm}
        onChange={(value) => update("zCm", Number(value))}
      />
      <Choice
        label="Rotation (degrees)"
        name="rotation"
        value={String(draft.rotationDeg)}
        onChange={(value) =>
          update("rotationDeg", Number(value) as DesignItem["rotationDeg"])
        }
      >
        {[0, 90, 180, 270].map((value) => (
          <option key={value}>{value}</option>
        ))}
      </Choice>
      <Choice
        label="Furniture finish"
        name="finish"
        value={draft.finish}
        onChange={(value) => update("finish", value as DesignItem["finish"])}
      >
        {finishes.map((finish) => (
          <option key={finish}>{finish}</option>
        ))}
      </Choice>
      {(["widthCm", "depthCm", "heightCm"] as const).map((key) => (
        <Input
          key={key}
          label={`Furniture ${key.replace("Cm", "")} (cm)`}
          name={key}
          type="number"
          min={Math.ceil(catalog[key] / 2)}
          max={catalog[key] * 2}
          step={1}
          value={draft[key]}
          onChange={(value) => update(key, Number(value))}
        />
      ))}
      <p className="interior-muted">
        Position measures the minimum floor corner from the room's left/front.
        Rotation swaps the floor footprint at 90° and 270°. Items may touch but
        cannot overlap.
      </p>
      <p className="interior-feedback" role="status">
        {issue ??
          "Placement fits inside the room without overlapping another item."}
      </p>
    </Form>
  );
}
function availableSlot(design: Design, catalog: CatalogItem) {
  for (let zCm = 0; zCm <= design.depthCm - catalog.depthCm; zCm += 10)
    for (let xCm = 0; xCm <= design.widthCm - catalog.widthCm; xCm += 10) {
      const item: DesignItem = {
        id: "preview-add",
        catalogId: catalog.id,
        xCm,
        zCm,
        rotationDeg: 0,
        widthCm: catalog.widthCm,
        depthCm: catalog.depthCm,
        heightCm: catalog.heightCm,
        finish: "Oak",
      };
      if (!placementIssue(design, item)) return { xCm, zCm };
    }
  return null;
}
function Furniture({
  view,
  design,
  workspace,
  selectedId,
  onSelect,
  onPreview,
}: Props & {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPreview: (design: Design | null) => void;
}) {
  const [error, setError] = useState("");
  const selected = design.items.find((item) => item.id === selectedId);
  async function insert(model: CatalogItem) {
    setError("");
    const position = availableSlot(design, model);
    if (!position) {
      setError(
        "No free floor space fits this item at its standard size. Move or remove furniture, or enlarge the room.",
      );
      return;
    }
    const result = await workspace.act(
      "item.add",
      {
        id: design.id,
        version: design.version,
        catalogId: model.id,
        ...position,
      },
      "Furniture inserted in a free floor position.",
    );
    if (result) {
      const state = result.state as InteriorView;
      const next = state.designs.find(
        (row) => row.id === state.selectedDesignId,
      );
      const added = next?.items.find(
        (item) => !design.items.some((old) => old.id === item.id),
      );
      if (added) onSelect(added.id);
      onPreview(null);
    }
  }
  return (
    <div className="interior-stack">
      <section className="demo-panel interior-card">
        <h3>Furniture in this room</h3>
        {design.items.length ? (
          design.items.map((item) => {
            const model = view.catalog.find(
              (row) => row.id === item.catalogId,
            )!;
            const footprint = itemFootprint(item);
            return (
              <article
                className="interior-object"
                key={item.id}
                data-selected={selectedId === item.id}
                data-testid={`interior-item-${item.id}`}
              >
                <div className="interior-card-top">
                  <h4>{model.name}</h4>
                  <Badge>{item.finish}</Badge>
                </div>
                <p className="interior-muted">
                  {footprint.widthCm} × {footprint.depthCm} cm footprint · X{" "}
                  {item.xCm}, Z {item.zCm} · {item.rotationDeg}°
                </p>
                <div className="labs-actions">
                  <Button
                    variant="secondary"
                    aria-pressed={selectedId === item.id}
                    onClick={() => {
                      onSelect(item.id);
                      onPreview(null);
                    }}
                  >
                    Select furniture
                  </Button>
                  {view.canEdit && (
                    <Button
                      variant="secondary"
                      disabled={busy(workspace)}
                      onClick={() =>
                        void workspace
                          .act(
                            "item.remove",
                            {
                              id: design.id,
                              version: design.version,
                              itemId: item.id,
                            },
                            "Furniture removed.",
                          )
                          .then((result) => {
                            if (result) {
                              onSelect(null);
                              onPreview(null);
                            }
                          })
                      }
                    >
                      Remove furniture
                    </Button>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <Empty>Choose furniture from the catalogue to begin.</Empty>
        )}
      </section>
      {selected && view.canEdit && (
        <ObjectEditor
          key={`${selected.id}:${design.version}`}
          view={view}
          design={design}
          workspace={workspace}
          item={selected}
          onPreview={onPreview}
        />
      )}
      <section
        className="interior-stack"
        aria-label="Fictional furniture catalogue"
      >
        <h3>Original furniture catalogue</h3>
        {error && (
          <p role="alert" className="interior-error">
            {error}
          </p>
        )}
        <div className="interior-grid interior-catalog">
          {view.catalog.map((model) => (
            <article className="interior-catalog-card" key={model.id}>
              <div
                className="interior-swatch"
                style={{
                  background:
                    model.kind === "sofa" || model.kind === "bed"
                      ? "#c7bbda"
                      : "#b78a57",
                }}
              />
              <h4>{model.name}</h4>
              <p className="interior-muted">
                {model.widthCm} × {model.depthCm} × {model.heightCm} cm
              </p>
              <strong>{rm(model.unitPriceSen)}</strong>
              {view.canEdit && (
                <Button
                  variant="secondary"
                  disabled={busy(workspace)}
                  onClick={() => void insert(model)}
                >
                  Insert {model.name}
                </Button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
function Saved({ view, design, workspace }: Props) {
  return (
    <div className="interior-stack">
      <p className="interior-notice">
        Accepted room and furniture changes autosave immediately. Save design
        adds a name and explicit save marker. Loading switches to another
        layout; duplicating creates independent item records.
      </p>
      {view.canEdit && (
        <Form
          title="Save or rename current layout"
          workspace={workspace}
          button="Save design"
          submit={(form) =>
            workspace.act(
              "design.save",
              {
                id: design.id,
                version: design.version,
                name: read(form, "name"),
              },
              "Design saved with an explicit marker.",
            )
          }
        >
          <Input label="Design name" name="name" defaultValue={design.name} />
        </Form>
      )}
      <div className="interior-grid">
        {view.designs.map((layout) => (
          <article
            className="demo-panel interior-card"
            key={layout.id}
            data-testid={`interior-design-${layout.id}`}
          >
            <div className="interior-card-top">
              <h3>{layout.name}</h3>
              {layout.id === design.id && <Badge>Current</Badge>}
            </div>
            <p>
              {layout.widthCm} × {layout.depthCm} × {layout.heightCm} cm ·{" "}
              {layout.items.length} items
            </p>
            <p className="interior-muted">
              Saved{" "}
              {new Intl.DateTimeFormat("en-MY", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Kuala_Lumpur",
              }).format(new Date(layout.savedAt))}{" "}
              MYT
            </p>
            {view.canEdit && (
              <div className="labs-actions">
                <Button
                  variant="secondary"
                  disabled={busy(workspace) || layout.id === design.id}
                  onClick={() =>
                    void workspace.act(
                      "design.load",
                      { id: layout.id },
                      "Saved layout loaded.",
                    )
                  }
                >
                  Load design
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy(workspace)}
                  onClick={() =>
                    void workspace.act(
                      "design.duplicate",
                      {
                        id: layout.id,
                        version: layout.version,
                        name: `${layout.name.slice(0, 74)} copy`,
                      },
                      "Independent layout copy created.",
                    )
                  }
                >
                  Duplicate design
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
      {view.canEdit && (
        <Form
          title="Create a room from a preset"
          workspace={workspace}
          button="Create preset room"
          submit={(form) =>
            workspace.act(
              "design.create",
              { name: read(form, "name"), presetId: read(form, "preset") },
              "Empty preset room created. Previous layout retained.",
            )
          }
        >
          <Input
            label="New design name"
            name="name"
            defaultValue="Fictional new room"
          />
          <Choice
            label="Room preset"
            name="preset"
            defaultValue={view.presets[0]?.id}
          >
            {view.presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} · {preset.widthCm} × {preset.depthCm} cm
              </option>
            ))}
          </Choice>
        </Form>
      )}
    </div>
  );
}
function Pricing({ view, workspace }: Omit<Props, "design">) {
  return (
    <div className="interior-stack">
      <p className="interior-notice">
        These editable rates are fictional demonstration assumptions. Saved
        designs use current catalogue prices. Floor rates per m²: Oak RM65,
        Terrazzo RM85, Concrete RM45. Gross wall finish: RM7.50 per m². Nothing
        is a commercial quotation.
      </p>
      <div className="interior-grid">
        {view.catalog.map((model) =>
          view.canPrice ? (
            <Form
              key={`${model.id}:${view.pricingVersion}`}
              title={model.name}
              workspace={workspace}
              button="Update demo price"
              submit={(form) =>
                workspace.act(
                  "pricing.update",
                  {
                    version: view.pricingVersion,
                    catalogId: model.id,
                    unitPriceSen: sen(read(form, "amount")),
                  },
                  "Fictional catalogue price updated.",
                )
              }
            >
              <Input
                label="Base price (RM)"
                name="amount"
                defaultValue={(model.unitPriceSen / 100).toFixed(2)}
              />
            </Form>
          ) : (
            <section className="demo-panel interior-card" key={model.id}>
              <h3>{model.name}</h3>
              <strong>{rm(model.unitPriceSen)}</strong>
            </section>
          ),
        )}
      </div>
    </div>
  );
}
function InteriorLoading() {
  return (
    <div className="interior-app interior-loading" aria-hidden="true">
      <div className="interior-nav">
        {views.map((item, index) => (
          <span
            key={item}
            className={`button ${index === 0 ? "primary" : "secondary"}`}
          >
            {item}
          </span>
        ))}
      </div>
      <header className="interior-heading">
        <div>
          <span className="eyebrow">Interior 3D Studio</span>
          <h2>
            <span className="interior-loading-value">
              Loading saved room layout
            </span>
          </h2>
          <p>{designIntroduction}</p>
        </div>
        <Badge>Loading workspace</Badge>
      </header>
      <Stats
        items={[
          {
            label: "Room dimensions",
            value: "0000 × 0000 cm",
          },
          { label: "Furniture instances", value: "—" },
          { label: "Saved layouts", value: "—" },
        ]}
      />
      <div className="interior-layout">
        <div className="interior-stack">
          <section>
            <div className="interior-toolbar">
              <h3>Interactive room</h3>
              <div className="labs-actions">
                <span className="button secondary">Reset camera</span>
                <span className="button secondary">Export screenshot</span>
              </div>
            </div>
            <div className="interior-scene-frame">
              <div className="interior-scene-fallback">
                <h3>Preparing 3D preview…</h3>
                <p>Loading your saved room and furniture.</p>
              </div>
            </div>
            <div className="labs-actions" style={{ marginTop: 12 }}>
              {["Orbit left", "Orbit right", "Zoom in", "Zoom out"].map(
                (label) => (
                  <span className="button secondary" key={label}>
                    {label}
                  </span>
                ),
              )}
            </div>
            <p className="interior-scene-caption">
              Drag to orbit, scroll or pinch to zoom, or use the camera buttons.
              Select furniture in the scene or in the item list. Geometry is
              original and uses no downloaded models.
            </p>
          </section>
          <div className="demo-panel interior-card interior-loading-form">
            <h3>Room dimensions & surfaces</h3>
            <div className="interior-fields">
              {[
                "Room width (cm)",
                "Room depth (cm)",
                "Room height (cm)",
                "Wall colour",
                "Floor material",
              ].map((label) => (
                <div className="field" key={label}>
                  <span className="interior-loading-label">{label}</span>
                  <div className="interior-loading-control" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <section className="demo-panel interior-card">
          <h3>Illustrative design estimate</h3>
          <strong className="interior-price interior-loading-value">
            RM0,000.00
          </strong>
          <p className="interior-muted">
            Furniture instances · configurable fictional rates, not a real
            quotation.
          </p>
          <div className="interior-loading-cost">
            {Array.from({ length: 5 }, (_, index) => (
              <span className="interior-loading-control" key={index} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Content({
  view,
  workspace,
}: {
  view: InteriorView;
  workspace: LabWorkspace;
}) {
  const [area, setArea] = useState<Area>("Design");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Design | null>(null);
  const design = view.designs.find((row) => row.id === view.selectedDesignId)!;
  useEffect(() => {
    setPreview(null);
    setSelectedId((current) =>
      design.items.some((item) => item.id === current) ? current : null,
    );
  }, [design.id, design.version]);
  let rendered = design;
  if (preview?.id === design.id) {
    try {
      quoteDesign(preview, view.catalog);
      if (
        [
          preview.widthCm,
          preview.depthCm,
          preview.heightCm,
          ...preview.items.flatMap((item) => [
            item.widthCm,
            item.depthCm,
            item.heightCm,
          ]),
        ].every((size) => Number.isSafeInteger(size) && size > 0)
      )
        rendered = preview;
    } catch {
      /* Invalid in-progress numeric input keeps the last saved scene visible. */
    }
  }
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);
  return (
    <div className="interior-app">
      <div
        className="interior-nav"
        role="group"
        aria-label="Interior design views"
      >
        {views.map((item) => (
          <Button
            key={item}
            variant={area === item ? "primary" : "secondary"}
            aria-pressed={area === item}
            onClick={() => {
              setArea(item);
              setPreview(null);
            }}
          >
            {item}
          </Button>
        ))}
      </div>
      <header className="interior-heading">
        <div>
          <span className="eyebrow">Interior 3D Studio</span>
          <h2>{design.name}</h2>
          <p>{designIntroduction}</p>
        </div>
        <Badge>{view.canEdit ? "Autosave enabled" : "Read only"}</Badge>
      </header>
      <Stats
        items={[
          {
            label: "Room dimensions",
            value: `${design.widthCm} × ${design.depthCm} cm`,
          },
          { label: "Furniture instances", value: design.items.length },
          { label: "Saved layouts", value: view.designs.length },
        ]}
      />
      <div className="interior-layout">
        <div className="interior-stack">
          <SceneArea
            design={rendered}
            view={view}
            selectedId={selectedId}
            onSelect={select}
          />
          {preview && (
            <p className="interior-feedback" role="status">
              Previewing changes. Apply the room or furniture controls to save
              them.
            </p>
          )}
          {area === "Design" &&
            (view.canEdit ? (
              <RoomEditor
                key={`${design.id}:${design.version}`}
                view={view}
                design={design}
                workspace={workspace}
                onPreview={setPreview}
              />
            ) : (
              <p className="interior-notice">
                Viewer is read only. Switch to Customer or Manager to configure
                your visitor workspace.
              </p>
            ))}
          {area === "Furniture" && (
            <Furniture
              view={view}
              design={design}
              workspace={workspace}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onPreview={setPreview}
            />
          )}
          {area === "Saved layouts" && (
            <Saved
              key={design.id}
              view={view}
              design={design}
              workspace={workspace}
            />
          )}
          {area === "Pricing" && <Pricing view={view} workspace={workspace} />}
        </div>
        <Cost design={rendered} view={view} />
      </div>
    </div>
  );
}
export function InteriorWorkspace() {
  const workspace = useLabWorkspace("interior-3d");
  const packet = workspace.packet;
  return (
    <LabShell
      title="Interior 3D Studio"
      category="Room design & illustrative pricing"
      description="Explore original 3D furniture, configure materials and save fictional room layouts with a transparent design estimate."
      workspace={workspace}
      roles={["customer", "manager", "viewer"]}
      loadingContent={<InteriorLoading />}
    >
      {packet && (
        <Content
          key={[packet.workspaceId, packet.generation, packet.role].join(":")}
          view={packet.state as InteriorView}
          workspace={workspace}
        />
      )}
    </LabShell>
  );
}
