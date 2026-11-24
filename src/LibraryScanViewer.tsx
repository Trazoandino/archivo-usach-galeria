import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import { Box3, Mesh, MeshBasicMaterial, SRGBColorSpace, Sphere, TextureLoader, Vector3 } from "three";
import type { BufferGeometry, Object3D, PerspectiveCamera } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

import LibraryViewCube from "./LibraryViewCube";
import type { LibraryScan } from "./libraryScans";
import { scanModelUrl, scanTextureUrl } from "./libraryScans";

function ResetCamera() {
  const { get } = useThree();
  useEffect(() => {
    const reset = () => (get().controls as unknown as { reset?: () => void } | null)?.reset?.();
    window.addEventListener("gallery-reset-view", reset);
    return () => window.removeEventListener("gallery-reset-view", reset);
  }, [get]);
  return null;
}
type Status = "loading" | "ready" | "error";
interface Framing { target: Vector3; radius: number; }

/**
 * Los escaneos traen la sala completa alrededor de la maqueta, así que encuadrar la caja total
 * la deja diminuta, y la mediana de todos los puntos cae en el piso o el pedestal. La maqueta es
 * lo que se escaneó con más detalle: se encuadra con el tercio de splats más finos (mediana como
 * objetivo, percentil de su distancia como radio).
 */
interface SplatSample { center: Vector3; size: number; }
function robustFraming(samples: SplatSample[]): Framing {
  const fine = [...samples].sort((a, b) => a.size - b.size).slice(0, Math.max(1, Math.floor(samples.length / 3))).map(s => s.center);
  const axis = (key: "x" | "y" | "z") => fine.map(p => p[key]).sort((a, b) => a - b)[Math.floor(fine.length / 2)];
  const target = new Vector3(axis("x"), axis("y"), axis("z"));
  const distances = fine.map(p => p.distanceTo(target)).sort((a, b) => a - b);
  return { target, radius: Math.max(distances[Math.floor(distances.length * .5)], 1e-3) };
}

function frameCamera(camera: PerspectiveCamera, controls: unknown, { target, radius }: Framing, distance = 2.6) {
  // Vista a tres cuartos, levemente elevada, como la vista previa de Scaniverse.
  const direction = new Vector3(.55, .62, 1).normalize();
  camera.position.copy(target).addScaledVector(direction, radius * distance);
  camera.near = radius / 200; camera.far = radius * 400; camera.updateProjectionMatrix();
  camera.lookAt(target);
  const orbit = controls as { target?: Vector3; update?: () => void; saveState?: () => void } | null;
  orbit?.target?.copy(target); orbit?.update?.(); orbit?.saveState?.();
}

function SplatScene({ url, onStatus }: { url: string; onStatus: (status: Status) => void }) {
  const { gl, scene, camera, get } = useThree();
  useEffect(() => {
    let cancelled = false;
    const spark = new SparkRenderer({ renderer: gl });
    // Ruta absoluta: Spark descarga y decodifica en un worker creado desde blob:, donde una ruta
    // relativa no se resuelve. Los .spz de Scaniverse ya vienen con Y hacia arriba (sin el giro
    // de 180° que necesitan los splats exportados con Y hacia abajo).
    const splat = new SplatMesh({ url: new URL(url, window.location.href).href });
    scene.add(spark, splat);
    splat.initialized.then(() => {
      if (cancelled) return;
      splat.updateMatrixWorld(true);
      const samples: SplatSample[] = [];
      splat.forEachSplat((index, center, scales) => {
        if (index % 17 === 0) samples.push({ center: center.clone().applyMatrix4(splat.matrixWorld), size: Math.max(scales.x, scales.y, scales.z) });
      });
      // Más lejos que la malla: el radio de los splats finos cubre sólo el núcleo de la maqueta.
      frameCamera(camera as PerspectiveCamera, get().controls, robustFraming(samples), 4);
      onStatus("ready");
    }).catch(() => { if (!cancelled) onStatus("error"); });
    return () => {
      cancelled = true; scene.remove(spark, splat);
      // Liberar un splat a medio cargar deja colgado al worker compartido de Spark (pasa al
      // montar dos veces en StrictMode o al cambiar rápido de proyecto): se libera al terminar.
      void splat.initialized.catch(() => undefined).finally(() => { splat.dispose(); spark.dispose(); });
    };
  }, [camera, get, gl, onStatus, scene, url]);
  return null;
}

function MeshScene({ url, texture, onStatus }: { url: string; texture: string; onStatus: (status: Status) => void }) {
  const { scene, camera, get } = useThree();
  useEffect(() => {
    let cancelled = false;
    let object: Object3D | null = null;
    const draco = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}models/decoders/draco/`);
    Promise.all([draco.loadAsync(url) as Promise<BufferGeometry>, new TextureLoader().loadAsync(texture)]).then(([geometry, map]) => {
      if (cancelled) { geometry.dispose(); map.dispose(); return; }
      map.colorSpace = SRGBColorSpace; map.flipY = false;
      geometry.computeBoundingBox();
      object = new Mesh(geometry, new MeshBasicMaterial({ map }));
      scene.add(object);
      const sphere = new Box3().setFromObject(object).getBoundingSphere(new Sphere());
      frameCamera(camera as PerspectiveCamera, get().controls, { target: sphere.center, radius: sphere.radius * .55 });
      onStatus("ready");
    }).catch(() => { if (!cancelled) onStatus("error"); }).finally(() => draco.dispose());
    return () => {
      cancelled = true;
      if (object instanceof Mesh) { scene.remove(object); object.geometry.dispose(); (object.material as MeshBasicMaterial).map?.dispose(); (object.material as MeshBasicMaterial).dispose(); }
    };
  }, [camera, get, onStatus, scene, texture, url]);
  return null;
}

/**
 * Visor propio de los escaneos: arrastrar o flechas para girar, rueda o Ctrl/Shift + flechas
 * para acercar, cubo de vistas para saltar a una cara y `turntable` para el modo exposición.
 */
export default function LibraryScanViewer({ scan, turntable = false }: { scan: LibraryScan; turntable?: boolean }) {
  const [status, setStatus] = useState<Status>("loading");
  return <div className="library-scan-viewer" data-status={status}>
    <Canvas key={scan.id} camera={{ fov: 50, position: [0, 1, 3] }} dpr={[1, 2]} gl={{ antialias: false }}>
      <color attach="background" args={["#2f3130"]} />
      <OrbitControls makeDefault enableDamping dampingFactor={.08} screenSpacePanning autoRotate={turntable} autoRotateSpeed={3.2} />
      {scan.model === "mesh"
        ? <MeshScene url={scanModelUrl(scan)} texture={scanTextureUrl(scan)} onStatus={setStatus} />
        : <SplatScene url={scanModelUrl(scan)} onStatus={setStatus} />}
      
      <ResetCamera /><LibraryViewCube />
    </Canvas>
    {status !== "ready" && <p className="library-model-message" role="status">{status === "loading" ? "Cargando escaneo 3D…" : "No se pudo cargar el escaneo en este dispositivo."}</p>}
  </div>;
}


