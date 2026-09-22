"use client";

import { useEffect, useRef } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Vector3 } from "three";
import type {
  CatalogItem,
  Design,
  DesignItem,
} from "../../../../packages/interior/model";
import { itemFootprint } from "../../../../packages/interior/helpers";

export type Capture = () => Promise<Blob | null>;
export type CameraActions = {
  zoom: (factor: number) => void;
  orbit: (degrees: number) => void;
};
export type SceneProps = {
  design: Design;
  catalog: CatalogItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCaptureReady: (capture: Capture | null) => void;
  onCameraReady: (actions: CameraActions | null) => void;
  cameraKey: number;
};
const wallPaint = {
  Linen: "#e5ded0",
  Sage: "#9baf96",
  Clay: "#c48f78",
  Midnight: "#37495f",
};
const floorPaint = { Oak: "#b6946d", Terrazzo: "#b6b8b3", Concrete: "#979fa5" };
const wood = { Oak: "#b78a57", Walnut: "#684631", White: "#e9e6df" };
function Block({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.82} />
    </mesh>
  );
}
function Furniture({
  item,
  catalog,
  design,
  selected,
  onSelect,
}: {
  item: DesignItem;
  catalog: CatalogItem;
  design: Design;
  selected: boolean;
  onSelect: SceneProps["onSelect"];
}) {
  const w = item.widthCm / 100,
    d = item.depthCm / 100,
    h = item.heightCm / 100;
  const footprint = itemFootprint(item);
  const color = wood[item.finish];
  const legs = (top: number, legHeight: number) =>
    [-1, 1].flatMap((x) =>
      [-1, 1].map((z) => (
        <Block
          key={`${x}:${z}`}
          color={color}
          position={[x * w * 0.38, top - legHeight / 2, z * d * 0.35]}
          size={[Math.min(0.07, w / 8), legHeight, Math.min(0.07, d / 8)]}
        />
      )),
    );
  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(item.id);
  };
  return (
    <group
      position={[
        (item.xCm + footprint.widthCm / 2 - design.widthCm / 2) / 100,
        0,
        (item.zCm + footprint.depthCm / 2 - design.depthCm / 2) / 100,
      ]}
      rotation={[0, (-item.rotationDeg * Math.PI) / 180, 0]}
      onClick={select}
    >
      {catalog.kind === "sofa" && (
        <>
          <Block
            color={color}
            position={[0, h * 0.32, 0]}
            size={[w, h * 0.44, d]}
          />
          <Block
            color="#d6c9bb"
            position={[0, h * 0.57, d * 0.06]}
            size={[w * 0.82, h * 0.16, d * 0.78]}
          />
          <Block
            color={color}
            position={[0, h * 0.77, -d * 0.43]}
            size={[w, h * 0.46, d * 0.14]}
          />
          <Block
            color={color}
            position={[-w * 0.46, h * 0.63, 0]}
            size={[w * 0.08, h * 0.38, d]}
          />
          <Block
            color={color}
            position={[w * 0.46, h * 0.63, 0]}
            size={[w * 0.08, h * 0.38, d]}
          />
          {legs(h * 0.16, h * 0.16)}
        </>
      )}
      {(catalog.kind === "table" || catalog.kind === "desk") && (
        <>
          <Block
            color={color}
            position={[0, h * 0.95, 0]}
            size={[w, h * 0.1, d]}
          />
          {legs(h * 0.9, h * 0.9)}
          {catalog.kind === "desk" && (
            <Block
              color={color}
              position={[w * 0.3, h * 0.65, 0]}
              size={[w * 0.25, h * 0.48, d * 0.82]}
            />
          )}
        </>
      )}
      {catalog.kind === "chair" && (
        <>
          <Block
            color={color}
            position={[0, h * 0.48, 0]}
            size={[w, h * 0.1, d]}
          />
          <Block
            color={color}
            position={[0, h * 0.76, -d * 0.44]}
            size={[w, h * 0.48, d * 0.12]}
          />
          {legs(h * 0.44, h * 0.44)}
        </>
      )}
      {catalog.kind === "bed" && (
        <>
          <Block
            color={color}
            position={[0, h * 0.22, 0]}
            size={[w, h * 0.28, d]}
          />
          <Block
            color="#eee4d3"
            position={[0, h * 0.44, d * 0.025]}
            size={[w * 0.96, h * 0.24, d * 0.92]}
          />
          <Block
            color={color}
            position={[0, h * 0.62, -d * 0.46]}
            size={[w, h * 0.76, d * 0.08]}
          />
          <Block
            color="#b4c6c2"
            position={[0, h * 0.58, d * 0.1]}
            size={[w * 0.96, h * 0.04, d * 0.54]}
          />
        </>
      )}
      {(catalog.kind === "shelf" || catalog.kind === "cabinet") && (
        <>
          <Block
            color={color}
            position={[-w * 0.47, h / 2, 0]}
            size={[w * 0.06, h, d]}
          />
          <Block
            color={color}
            position={[w * 0.47, h / 2, 0]}
            size={[w * 0.06, h, d]}
          />
          <Block
            color={color}
            position={[0, h / 2, -d * 0.46]}
            size={[w, h, d * 0.08]}
          />
          {[0.03, 0.35, 0.67, 0.97].map((level) => (
            <Block
              key={level}
              color={color}
              position={[0, h * level, 0]}
              size={[w, h * 0.04, d]}
            />
          ))}
          {catalog.kind === "cabinet" && (
            <Block
              color={color}
              position={[0, h / 2, d * 0.46]}
              size={[w * 0.93, h * 0.94, d * 0.08]}
            />
          )}
        </>
      )}
      {catalog.kind === "lamp" && (
        <>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[w * 0.42, w * 0.45, 0.06, 24]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, h * 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, h * 0.8, 16]} />
            <meshStandardMaterial color="#8c7763" />
          </mesh>
          <mesh position={[0, h * 0.86, 0]} castShadow>
            <cylinderGeometry
              args={[w * 0.26, w * 0.5, h * 0.28, 24, 1, true]}
            />
            <meshStandardMaterial color="#f1dcb6" side={2} />
          </mesh>
        </>
      )}
      {selected && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.035, h + 0.035, d + 0.035]} />
          <meshBasicMaterial color="#6752e8" wireframe />
        </mesh>
      )}
    </group>
  );
}
function CameraControls({
  design,
  cameraKey,
  onCaptureReady,
  onCameraReady,
}: Pick<
  SceneProps,
  "design" | "cameraKey" | "onCaptureReady" | "onCameraReady"
>) {
  const { camera, gl, scene, invalidate } = useThree();
  const controlRef = useRef<OrbitControls | null>(null);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controlRef.current = controls;
    controls.target.set(0, Math.min(1, design.heightCm / 250), 0);
    controls.minDistance = 2;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.enableDamping = true;
    const changed = () => invalidate();
    controls.addEventListener("change", changed);
    camera.position.set(
      (design.widthCm / 100) * 0.95,
      Math.max(4, (design.heightCm / 100) * 1.35),
      (design.depthCm / 100) * 1.2,
    );
    controls.update();
    const capture = async () => {
      gl.render(scene, camera);
      return new Promise<Blob | null>((resolve) =>
        gl.domElement.toBlob(resolve, "image/png"),
      );
    };
    onCaptureReady(capture);
    onCameraReady({
      zoom(factor) {
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(
          Math.max(
            controls.minDistance,
            Math.min(controls.maxDistance, offset.length() * factor),
          ),
        );
        camera.position.copy(controls.target).add(offset);
        controls.update();
        invalidate();
      },
      orbit(degrees) {
        const offset = camera.position
          .clone()
          .sub(controls.target)
          .applyAxisAngle(new Vector3(0, 1, 0), (degrees * Math.PI) / 180);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        invalidate();
      },
    });
    return () => {
      controls.removeEventListener("change", changed);
      controls.dispose();
      controlRef.current = null;
      onCaptureReady(null);
      onCameraReady(null);
    };
  }, [
    camera,
    gl,
    scene,
    invalidate,
    design.widthCm,
    design.depthCm,
    design.heightCm,
    cameraKey,
    onCaptureReady,
    onCameraReady,
  ]);
  useFrame(() => controlRef.current?.update());
  return null;
}
export default function InteriorScene({
  design,
  catalog,
  selectedId,
  onSelect,
  onCaptureReady,
  onCameraReady,
  cameraKey,
}: SceneProps) {
  const w = design.widthCm / 100,
    d = design.depthCm / 100,
    h = design.heightCm / 100;
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 48, near: 0.1, far: 100, position: [6, 5, 7] }}
      onPointerMissed={() => onSelect(null)}
      onCreated={({ gl }) => {
        gl.domElement.setAttribute("role", "img");
        gl.domElement.setAttribute(
          "aria-label",
          "Interactive 3D room with fictional furniture",
        );
        gl.domElement.dataset.rendered = "true";
      }}
      fallback={
        <div className="interior-scene-fallback">
          <h3>3D preview unavailable</h3>
          <p>Use the numeric design controls and saved layout below.</p>
        </div>
      }
    >
      <color attach="background" args={["#e9e9f3"]} />
      <ambientLight intensity={1.1} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <Block
        color={floorPaint[design.floorMaterial]}
        position={[0, -0.045, 0]}
        size={[w, 0.09, d]}
      />
      <Block
        color={wallPaint[design.wallColor]}
        position={[0, h / 2, -d / 2 - 0.04]}
        size={[w + 0.16, h, 0.08]}
      />
      <Block
        color={wallPaint[design.wallColor]}
        position={[-w / 2 - 0.04, h / 2, 0]}
        size={[0.08, h, d]}
      />
      {design.floorMaterial === "Oak" &&
        Array.from({ length: Math.floor(w / 0.25) }, (_, index) => (
          <Block
            key={index}
            color="#a78661"
            position={[-w / 2 + index * 0.25, 0.003, 0]}
            size={[0.006, 0.006, d]}
          />
        ))}
      {design.items.map((item) => {
        const model = catalog.find((row) => row.id === item.catalogId);
        return model ? (
          <Furniture
            key={item.id}
            item={item}
            catalog={model}
            design={design}
            selected={selectedId === item.id}
            onSelect={onSelect}
          />
        ) : null;
      })}
      <CameraControls
        design={design}
        cameraKey={cameraKey}
        onCaptureReady={onCaptureReady}
        onCameraReady={onCameraReady}
      />
    </Canvas>
  );
}
