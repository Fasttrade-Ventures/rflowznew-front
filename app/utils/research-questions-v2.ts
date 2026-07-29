import type { SimulationEngineRoute } from "#app/utils/new-project-wizard";

export type PaperSimulationMeta = {
  purpose?: string;
  rqCount?: number;
  engineRoute?: SimulationEngineRoute[] | string[];
  simulation_v2?: boolean;
};

export type RqSlotConfig = {
  slot: number;
  type: "review" | "empirical" | "artifact";
  typeLabel: string;
  engine: string;
  engineLabel: string;
  editHint: string;
};

const RQ_SLOTS: RqSlotConfig[] = [
  {
    slot: 1,
    type: "review",
    typeLabel: "review",
    engine: "TreZ",
    engineLabel: "TreZ",
    editHint: "✎ Click to edit",
  },
  {
    slot: 2,
    type: "empirical",
    typeLabel: "empirical",
    engine: "TAM",
    engineLabel: "TAM",
    editHint:
      "✎ Edited by you · Interview questions will be generated beneath RQ2, later",
  },
  {
    slot: 3,
    type: "artifact",
    typeLabel: "artifact",
    engine: "artifact",
    engineLabel: "builder",
    editHint: "✎ Click to edit",
  },
];

export type RqSubEntry = {
  id: number;
  question: string;
  order: number;
};

export type RqFormValues = {
  main: string;
  subs: RqSubEntry[];
};

export function effectiveRqCount(meta?: PaperSimulationMeta | null): number {
  const purpose = meta?.purpose ?? "masters";
  if (purpose === "paper" || purpose === "project") {
    return 1;
  }
  const rqCount = meta?.rqCount;
  if (typeof rqCount === "number" && rqCount >= 1 && rqCount <= 3) {
    return rqCount;
  }
  return purpose === "phd" ? 3 : 2;
}

export function rqSlotsForCount(count: number): RqSlotConfig[] {
  return RQ_SLOTS.slice(0, Math.max(1, Math.min(count, 3)));
}

export function rqPageSubtitle(count: number): string {
  if (count === 1) {
    return "Each RQ has Ask Prof Z + rich text editor · 1 RQ project";
  }
  if (count === 2) {
    return "Each RQ has Ask Prof Z + rich text editor · Master's (2 RQs)";
  }
  return "Each RQ has Ask Prof Z + rich text editor · PhD (3 RQs)";
}

export function readRqFromSlot(values: RqFormValues, slot: number): string {
  if (slot === 1) {
    return values.main;
  }
  const sub = values.subs.find((entry) => entry.order === slot - 1);
  return sub?.question ?? "";
}

export function writeRqToSlot(
  values: RqFormValues,
  slot: number,
  text: string
): RqFormValues {
  if (slot === 1) {
    return { ...values, main: text };
  }
  const order = slot - 1;
  const subs = values.subs.map((entry) =>
    entry.order === order ? { ...entry, question: text } : entry
  );
  return { ...values, subs };
}

export function getSubIdForSlot(
  values: RqFormValues,
  slot: number
): number | null {
  if (slot === 1) {
    return null;
  }
  return values.subs.find((entry) => entry.order === slot - 1)?.id ?? null;
}

export function ablyEventForSlot(slot: number): string {
  return `research-question-rq${slot}`;
}

export function engineMapLabel(slot: RqSlotConfig): string {
  return `RQ${slot.slot} → ${slot.engineLabel} (${slot.typeLabel})`;
}

export function isRqV2Complete(
  meta: PaperSimulationMeta | null | undefined,
  values: RqFormValues,
  minLength = 10
): boolean {
  const count = effectiveRqCount(meta);
  for (let slot = 1; slot <= count; slot += 1) {
    if (readRqFromSlot(values, slot).trim().length < minLength) {
      return false;
    }
  }
  return true;
}
