import { GizmoHelper, RoundedBox, useGizmoContext } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace, Vector3 } from "three";
import type { ThreeEvent } from "@react-three/fiber";

/**
 * Cubo de vistas propio: cuerpo redondeado claro, rótulos que se encienden en el turquesa de la
 * marca al pasar el puntero y un anillo de brújula a sus pies. Al hacer clic en una cara la
 * cámara gira hasta mirarla de frente (lo hace GizmoHelper con su tween).
 */
const TEAL = "#00a499";
const INK = "#1d2826";
const SIZE = 1.3;
const HALF = SIZE / 2 + .002;

// Nombre, normal de la cara y rotación del plano del rótulo para que mire hacia afuera.
const FACES: { label: string; normal: [number, number, number]; rotation: [number, number, number] }[] = [
  { label: "DER", normal: [1, 0, 0], rotation: [0, Math.PI / 2, 0] },
  { label: "IZQ", normal: [-1, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  { label: "PLANTA", normal: [0, 1, 0], rotation: [-Math.PI / 2, 0, 0] },
  { label: "BAJO", normal: [0, -1, 0], rotation: [Math.PI / 2, 0, 0] },
  { label: "FRENTE", normal: [0, 0, 1], rotation: [0, 0, 0] },
  { label: "ATRÁS", normal: [0, 0, -1], rotation: [0, Math.PI, 0] },
];

function labelTexture(text: string, hover: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  if (hover) {
    ctx.fillStyle = TEAL;
    ctx.beginPath(); ctx.roundRect(14, 14, 228, 228, 46); ctx.fill();
  }
  ctx.fillStyle = hover ? "#ffffff" : INK;
  const size = text.length > 4 ? 46 : 58;
  ctx.font = `700 ${size}px 'Inter Variable', Inter, Arial, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.letterSpacing = "3px";
  ctx.fillText(text, 128, 132);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}

function Cube() {
  const { tweenCamera } = useGizmoContext();
  const [hovered, setHovered] = useState<number | null>(null);
  const textures = useMemo(() => FACES.map(face => [labelTexture(face.label, false), labelTexture(face.label, true)]), []);
  useEffect(() => () => textures.flat().forEach(texture => texture.dispose()), [textures]);
  useEffect(() => {
    document.body.style.cursor = hovered === null ? "" : "pointer";
    return () => { document.body.style.cursor = ""; };
  }, [hovered]);
  const pick = (index: number) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    tweenCamera(new Vector3(...FACES[index].normal));
  };
  return <group>
    <ambientLight intensity={1.6} />
    <directionalLight position={[2, 3, 4]} intensity={1.4} />
    <RoundedBox args={[SIZE, SIZE, SIZE]} radius={.2} smoothness={4}>
      <meshStandardMaterial color="#f3f7f6" roughness={.55} metalness={.05} transparent opacity={.94} />
    </RoundedBox>
    {FACES.map((face, index) => <mesh key={face.label}
      position={face.normal.map(value => value * HALF) as [number, number, number]} rotation={face.rotation}
      onPointerOver={event => { event.stopPropagation(); setHovered(index); }}
      onPointerOut={() => setHovered(current => current === index ? null : current)}
      onClick={pick(index)}>
      <planeGeometry args={[SIZE * .86, SIZE * .86]} />
      <meshBasicMaterial map={textures[index][hovered === index ? 1 : 0]} transparent toneMapped={false} />
    </mesh>)}
    {/* Anillo de brújula a los pies del cubo, con una marca hacia el frente. */}
    <mesh position={[0, -SIZE * .62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[SIZE * .95, SIZE * 1.02, 64]} />
      <meshBasicMaterial color={TEAL} transparent opacity={.85} side={DoubleSide} toneMapped={false} />
    </mesh>
    <mesh position={[0, -SIZE * .62, SIZE * 1.1]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[SIZE * .09, 24]} />
      <meshBasicMaterial color={TEAL} side={DoubleSide} toneMapped={false} />
    </mesh>
  </group>;
}

export default function LibraryViewCube() {
  // GizmoHelper dibuja con una cámara ortográfica en píxeles: la escala es el tamaño en pantalla.
  return <GizmoHelper alignment="top-right" margin={[58, 58]}>
    <group scale={30}><Cube /></group>
  </GizmoHelper>;
}
