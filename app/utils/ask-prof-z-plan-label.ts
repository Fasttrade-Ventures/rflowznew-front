/** Display-only labels for Ask Prof Z by plan (logic unchanged). */
export function getAskProfZPlanDisplay(planKey?: string | null): {
  value: string;
  sub: string;
} {
  const isFree = !planKey || planKey === "free";

  return {
    value: isFree ? "Limited" : "Unlimited",
    sub: "Ask Prof Z included",
  };
}
