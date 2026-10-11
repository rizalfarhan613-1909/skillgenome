"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CatmullRomCurve3, Group, Quaternion, TubeGeometry, Vector3 } from "three";
import { useEffect, useMemo, useRef, useState } from "react";

const HELIX_HEIGHT = 3.8;
const HELIX_RADIUS = 0.85;
const HELIX_TURNS = 2.5;
const SAMPLE_COUNT = 160;

function getHelixPoint(t: number, phase: number): Vector3 {
  const angle = t * Math.PI * 2 * HELIX_TURNS + phase;
  return new Vector3(
    HELIX_RADIUS * Math.cos(angle),
    (t - 0.5) * HELIX_HEIGHT,
    HELIX_RADIUS * Math.sin(angle),
  );
}

function HelixStrand({ phase, color }: { phase: number; color: string }) {
  const strandGeometry = useMemo(() => {
    const points = Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) =>
      getHelixPoint(index / SAMPLE_COUNT, phase),
    );
    const curve = new CatmullRomCurve3(points);
    return new TubeGeometry(curve, SAMPLE_COUNT * 2, 0.035, 8, false);
  }, [phase]);

  const beadPositions = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) =>
        getHelixPoint(index / 19, phase).toArray(),
      ),
    [phase],
  );

  return (
    <group>
      <mesh geometry={strandGeometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.45}
          metalness={0.2}
          roughness={0.35}
        />
      </mesh>
      {beadPositions.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function HelixRungs() {
  const rungs = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => {
        const t = (index + 0.5) / 22;
        const start = getHelixPoint(t, 0);
        const end = getHelixPoint(t, Math.PI);
        const direction = end.clone().sub(start);
        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        const rotation = new Quaternion().setFromUnitVectors(
          new Vector3(0, 1, 0),
          direction.clone().normalize(),
        );
        return {
          position: midpoint.toArray(),
          quaternion: rotation.toArray(),
          length: direction.length(),
        };
      }),
    [],
  );

  return (
    <group>
      {rungs.map((rung, index) => (
        <mesh
          key={index}
          position={rung.position}
          quaternion={rung.quaternion}
          scale={[1, rung.length, 1]}
        >
          <cylinderGeometry args={[0.018, 0.018, 1, 8]} />
          <meshStandardMaterial
            color="#A5B4FC"
            emissive="#6366F1"
            emissiveIntensity={0.25}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

function AnimatedHelix() {
  const spinRef = useRef<Group>(null);
  const tiltRef = useRef<Group>(null);
  const pointer = useThree((state) => state.pointer);

  useFrame((_, delta) => {
    if (!spinRef.current || !tiltRef.current) {
      return;
    }

    spinRef.current.rotation.y += delta * 0.2;
    tiltRef.current.rotation.x += (pointer.y * 0.18 - tiltRef.current.rotation.x) * 0.04;
    tiltRef.current.rotation.z += (-pointer.x * 0.18 - tiltRef.current.rotation.z) * 0.04;
  });

  return (
    <group ref={spinRef}>
      <group ref={tiltRef}>
        <HelixStrand phase={0} color="#6366F1" />
        <HelixStrand phase={Math.PI} color="#22D3EE" />
        <HelixRungs />
      </group>
    </group>
  );
}

function StaticHelix() {
  const strandA: string[] = [];
  const strandB: string[] = [];

  for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
    const t = index / SAMPLE_COUNT;
    const pointA = getHelixPoint(t, 0);
    const pointB = getHelixPoint(t, Math.PI);
    const xA = 120 + pointA.x * 44;
    const xB = 120 + pointB.x * 44;
    const y = 20 + t * 260;
    strandA.push(`${index === 0 ? "M" : "L"}${xA},${y}`);
    strandB.push(`${index === 0 ? "M" : "L"}${xB},${y}`);
  }

  return (
    <svg viewBox="0 0 240 300" className="h-full w-full" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => {
        const t = (index + 0.5) / 18;
        const start = getHelixPoint(t, 0);
        const end = getHelixPoint(t, Math.PI);
        const y = 20 + t * 260;
        return (
          <line
            key={index}
            x1={120 + start.x * 44}
            y1={y}
            x2={120 + end.x * 44}
            y2={y}
            stroke="#A5B4FC"
            strokeOpacity="0.55"
            strokeWidth="2"
          />
        );
      })}
      <path d={strandA.join(" ")} fill="none" stroke="#6366F1" strokeWidth="7" />
      <path d={strandB.join(" ")} fill="none" stroke="#22D3EE" strokeWidth="7" />
    </svg>
  );
}

function supportsWebGL(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(
    window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl")),
  );
}

/** Merender heliks DNA animasi dengan fallback statis yang aksesibel. */
export default function DNAHelix() {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateSupport = () => {
      setCanAnimate(!motionPreference.matches && supportsWebGL());
    };

    updateSupport();
    motionPreference.addEventListener("change", updateSupport);
    return () => motionPreference.removeEventListener("change", updateSupport);
  }, []);

  if (!canAnimate) {
    return (
      <div className="h-full w-full" aria-hidden="true">
        <StaticHelix />
      </div>
    );
  }

  return (
    <div className="h-full w-full" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.5], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        fallback={<StaticHelix />}
      >
        <ambientLight intensity={1.2} />
        <pointLight position={[4, 3, 4]} intensity={35} color="#A5B4FC" />
        <AnimatedHelix />
      </Canvas>
    </div>
  );
}
