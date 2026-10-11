"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  greedyPath,
  ROLE_WEIGHTS,
  TARGET_MASTERY,
  type Mastery,
  type RoleName,
  type SkillName,
} from "@/lib/genome-core";

export interface ExplainPopoverProps {
  skill: SkillName;
  mastery: Mastery;
  role: RoleName;
}

const mobileQuery = "(max-width: 639px)";

function subscribeToViewport(callback: () => void) {
  const mediaQuery = window.matchMedia(mobileQuery);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getMobileSnapshot() {
  return window.matchMedia(mobileQuery).matches;
}

function getServerSnapshot() {
  return false;
}

/** Menjelaskan faktor skor dengan popover desktop atau sheet mobile. */
export function ExplainPopover({
  skill,
  mastery,
  role,
}: ExplainPopoverProps) {
  const isMobile = useSyncExternalStore(
    subscribeToViewport,
    getMobileSnapshot,
    getServerSnapshot,
  );
  const currentMastery = Math.max(0, Math.min(1, mastery[skill]));
  const masteryPercent = Math.round(currentMastery * 100);
  const gapPercent = Math.round(
    Math.max(TARGET_MASTERY - currentMastery, 0) * 100,
  );
  const importance = ROLE_WEIGHTS[role][skill];
  const priorityPath = greedyPath(mastery, role, 8);
  const priorityIndex = priorityPath.findIndex((step) => step.skill === skill);
  const sharePercent = priorityIndex < 0 ? 0 : priorityPath[priorityIndex].share_pct;
  const explanation =
    priorityIndex < 0
      ? `Skor ${skill} kamu ${masteryPercent}%. Target 80%. Gap ${gapPercent}% dengan importance ${importance.toFixed(2)} — skill ini sudah mencapai target dan tidak masuk prioritas roadmap.`
      : `Skor ${skill} kamu ${masteryPercent}%. Target 80%. Gap ${gapPercent}% dengan importance ${importance.toFixed(2)} — prioritas #${priorityIndex + 1} di roadmap.`;

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="border-glass-border text-primary-soft hover:bg-glass"
            />
          }
        >
          Kenapa skor ini?
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] overflow-y-auto border-glass-border bg-bg text-text"
        >
          <SheetHeader className="px-5 pt-6">
            <SheetTitle>{skill}: penjelasan skor</SheetTitle>
            <SheetDescription className="text-muted">
              Faktor yang membentuk skor dan prioritas belajar skill ini.
            </SheetDescription>
          </SheetHeader>
          <Explanation
            masteryPercent={masteryPercent}
            gapPercent={gapPercent}
            importance={importance}
            sharePercent={sharePercent}
            priorityIndex={priorityIndex}
            explanation={explanation}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="border-glass-border text-primary-soft hover:bg-glass"
          />
        }
      >
        Kenapa skor ini?
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="border-glass-border bg-bg p-4 text-text"
      >
        <PopoverHeader>
          <PopoverTitle>{skill}: penjelasan skor</PopoverTitle>
          <PopoverDescription className="text-muted">
            Faktor yang membentuk skor dan prioritas belajar skill ini.
          </PopoverDescription>
        </PopoverHeader>
        <Explanation
          masteryPercent={masteryPercent}
          gapPercent={gapPercent}
          importance={importance}
          sharePercent={sharePercent}
          priorityIndex={priorityIndex}
          explanation={explanation}
        />
      </PopoverContent>
    </Popover>
  );
}

interface ExplanationProps {
  masteryPercent: number;
  gapPercent: number;
  importance: number;
  sharePercent: number;
  priorityIndex: number;
  explanation: string;
}

function Explanation({
  masteryPercent,
  gapPercent,
  importance,
  sharePercent,
  priorityIndex,
  explanation,
}: ExplanationProps) {
  return (
    <div className="space-y-3 px-4 pb-4 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <dt className="text-muted">Mastery saat ini</dt>
        <dd className="text-right font-mono tabular-nums text-text">
          {masteryPercent}%
        </dd>
        <dt className="text-muted">Gap terhadap target 80%</dt>
        <dd className="text-right font-mono tabular-nums text-text">
          {gapPercent}%
        </dd>
        <dt className="text-muted">Importance role</dt>
        <dd className="text-right font-mono tabular-nums text-text">
          {importance.toFixed(2)}
        </dd>
        <dt className="text-muted">Kontribusi prioritas</dt>
        <dd className="text-right font-mono tabular-nums text-text">
          {sharePercent.toFixed(1)}%
        </dd>
      </dl>
      <p className="border-t border-glass-border pt-3 leading-relaxed text-muted">
        {explanation}
      </p>
      {priorityIndex >= 0 && (
        <p className="text-xs text-muted">
          Kontribusi dihitung sebagai bagian dari total gap tertimbang pada
          roadmap saat ini.
        </p>
      )}
    </div>
  );
}
