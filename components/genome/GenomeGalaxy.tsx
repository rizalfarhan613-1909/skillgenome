"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import galaxyLayout from "@/lib/data/galaxy-layout.json";
import {
  ROLE_WEIGHTS,
  SKILLS,
  type Mastery,
  type RoleName,
  type SkillName,
} from "@/lib/genome-core";
import { RadarGenome } from "./RadarGenome";

export interface GenomeGalaxyProps {
  mastery: Mastery;
  role: RoleName;
  focusedSkill: SkillName | null;
  onSkillFocus: (skill: SkillName | null) => void;
}

const skillColors: Record<SkillName, string> = {
  SQL: "#22D3EE",
  Python: "#22D3EE",
  Statistics: "#818CF8",
  Excel: "#22D3EE",
  DataViz: "#818CF8",
  BusinessAcumen: "#34D399",
  Communication: "#F472B6",
  DomainKnowledge: "#34D399",
};

const skillConnections: readonly (readonly [SkillName, SkillName])[] = [
  ["BusinessAcumen", "DomainKnowledge"],
  ["SQL", "Python"],
  ["BusinessAcumen", "Communication"],
  ["Python", "Excel"],
  ["Excel", "DataViz"],
];

function GalaxyScene({
  mastery,
  role,
  focusedSkill,
  onSkillFocus,
}: GenomeGalaxyProps) {
  const rotationGroup = useRef<Group>(null);

  useFrame((_, delta) => {
    if (rotationGroup.current) {
      rotationGroup.current.rotation.y += delta * 0.035;
    }
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 0, 4]} intensity={0.7} color="#A5B4FC" />
      <group ref={rotationGroup}>
        {skillConnections.map(([from, to]) => {
          const start = galaxyLayout[from];
          const end = galaxyLayout[to];
          return (
            <Line
              key={`${from}-${to}`}
              start={[start.x, start.y, start.z]}
              end={[end.x, end.y, end.z]}
              color="#94A3B8"
              opacity={0.3}
            />
          );
        })}
        {SKILLS.map((skill) => {
          const position = galaxyLayout[skill];
          const color = skillColors[skill];
          const isFocused = focusedSkill === skill;
          const importance = ROLE_WEIGHTS[role][skill];
          const radius = 0.075 + importance * 0.12;
          const brightness = Math.max(0, Math.min(1, mastery[skill]));

          return (
            <mesh
              key={skill}
              position={[position.x, position.y, position.z]}
              scale={isFocused ? 1.18 : 1}
              onPointerOver={(event) => {
                event.stopPropagation();
                onSkillFocus(skill);
              }}
              onPointerOut={() => onSkillFocus(null)}
            >
              <sphereGeometry args={[radius, 20, 20]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.05 + brightness * 1.1}
                roughness={0.28}
                metalness={0.12}
              />
              {isFocused && (
                <Html center distanceFactor={8} position={[0, radius + 0.16, 0]}>
                  <span className="pointer-events-none whitespace-nowrap rounded-md border border-glass-border bg-bg/90 px-2 py-1 text-xs text-text shadow-lg">
                    {skill} · {Math.round(brightness * 100)}%
                  </span>
                </Html>
              )}
            </mesh>
          );
        })}
      </group>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={3.2}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.25}
      />
    </>
  );
}

interface LineProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  opacity: number;
}

function Line({ start, end, color, opacity }: LineProps) {
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array([...start, ...end]), 3]}
          count={2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

/** Menampilkan galaksi 3D skill dengan radar fallback dan kontrol keyboard. */
export function GenomeGalaxy({
  mastery,
  role,
  focusedSkill,
  onSkillFocus,
}: GenomeGalaxyProps) {
  const reduceMotion = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(true);
  const nodeButtons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const updateVisibility = () =>
      setPageVisible(document.visibilityState === "visible");
    const initialVisibility = window.setTimeout(updateVisibility, 0);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      window.clearTimeout(initialVisibility);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  if (reduceMotion) {
    return (
      <RadarGenome
        mastery={mastery}
        role={role}
        focusedSkill={focusedSkill}
      />
    );
  }

  return (
    <div className="relative h-full min-h-72 w-full">
      <Canvas
        aria-hidden="true"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.8], fov: 42 }}
        frameloop={pageVisible ? "always" : "never"}
        fallback={
          <RadarGenome
            mastery={mastery}
            role={role}
            focusedSkill={focusedSkill}
          />
        }
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <GalaxyScene
          mastery={mastery}
          role={role}
          focusedSkill={focusedSkill}
          onSkillFocus={onSkillFocus}
        />
      </Canvas>
      <div className="sr-only" aria-label="Node galaksi yang dapat dipilih">
        {SKILLS.map((skill, index) => (
          <button
            key={skill}
            ref={(element) => {
              nodeButtons.current[index] = element;
            }}
            type="button"
            aria-label={`${skill}, penguasaan ${Math.round(mastery[skill] * 100)} persen`}
            aria-pressed={focusedSkill === skill}
            onFocus={() => onSkillFocus(skill)}
            onBlur={() => onSkillFocus(null)}
            onKeyDown={(event) => {
              const direction =
                event.key === "ArrowRight" || event.key === "ArrowDown"
                  ? 1
                  : event.key === "ArrowLeft" || event.key === "ArrowUp"
                    ? -1
                    : 0;
              if (direction === 0) {
                return;
              }
              event.preventDefault();
              const nextIndex =
                (index + direction + SKILLS.length) % SKILLS.length;
              nodeButtons.current[nextIndex]?.focus();
            }}
            className="focus:not-sr-only"
          >
            {skill}
          </button>
        ))}
      </div>
      <table className="sr-only">
        <caption>Penguasaan skill dalam galaksi</caption>
        <thead>
          <tr>
            <th scope="col">Skill</th>
            <th scope="col">Penguasaan</th>
            <th scope="col">Importance</th>
          </tr>
        </thead>
        <tbody>
          {SKILLS.map((skill) => (
            <tr key={skill}>
              <th scope="row">{skill}</th>
              <td>{Math.round(mastery[skill] * 100)}%</td>
              <td>{ROLE_WEIGHTS[role][skill].toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
