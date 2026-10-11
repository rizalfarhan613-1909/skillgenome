import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SkillDetailContent } from "@/components/genome/SkillDetailContent";
import { SKILLS } from "@/lib/genome-core";

interface SkillPageProps {
  params: Promise<{ skill: string }>;
}

async function SkillRoute({ params }: SkillPageProps) {
  const { skill: routeSkill } = await params;
  const skill = SKILLS.find((candidate) => candidate === routeSkill);

  if (!skill) {
    notFound();
  }

  return <SkillDetailContent skill={skill} />;
}

/** Menyediakan shell dan boundary streaming untuk parameter route dinamis. */
export default function SkillPage({ params }: SkillPageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-5xl space-y-6 px-4 py-8 sm:px-6">
          <div className="h-10 w-64 animate-pulse rounded bg-glass" />
          <div className="h-64 animate-pulse rounded-lg bg-glass" />
          <p className="sr-only" role="status">
            Memuat detail skill…
          </p>
        </main>
      }
    >
      <SkillRoute params={params} />
    </Suspense>
  );
}
