function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

/**
 * Toggle between simulation flow (v2) and legacy DSR flow (v1).
 * Set PAPER_V2_FLOW=true in fe-rflowz/.env to enable the new layout/nav.
 */
export function isPaperV2FlowEnabled(): boolean {
  return parseBoolean(process.env.PAPER_V2_FLOW);
}
