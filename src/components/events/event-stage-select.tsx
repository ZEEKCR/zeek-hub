"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moveEventStageAction } from "@/app/(app)/eventos/actions";
import { STAGE_LABEL, STAGE_ORDER } from "@/server/catalog/status";
import type { ActivityStage } from "@/server/domain/types";

export function EventStageSelect({
  id,
  stage,
  disabled,
}: {
  id: string;
  stage: ActivityStage;
  disabled: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(stage);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: ActivityStage) {
    if (disabled || pending || next === value) return;
    const previous = value;
    setValue(next);
    setPending(true);
    setError(null);
    try {
      const result = await moveEventStageAction(id, next);
      if (!result.ok) {
        setValue(previous);
        setError(result.message);
        return;
      }
      router.refresh();
    } catch {
      setValue(previous);
      setError("No se pudo guardar la etapa en Notion.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid max-w-sm gap-2">
      <label className="grid gap-1 text-sm font-medium">
        Etapa
        <select
          className="bg-surface-2 h-11 rounded-full px-4 text-sm"
          value={value}
          disabled={disabled || pending}
          onChange={(event) => change(event.target.value as ActivityStage)}
        >
          {STAGE_ORDER.map((option) => (
            <option key={option} value={option}>
              {STAGE_LABEL[option]}
            </option>
          ))}
        </select>
      </label>
      {value === "finished" ? (
        <p className="text-muted text-sm">
          Las tareas de este evento quedan fuera del tablero. Siguen en Notion.
        </p>
      ) : null}
      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
