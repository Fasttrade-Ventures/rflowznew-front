export function hasPlanAccess(
  subscriptionStatus: string | null | undefined
): boolean {
  return (
    subscriptionStatus === "active" || subscriptionStatus === "trialing"
  );
}

export function isFreePlan(planKey: string | null | undefined): boolean {
  return planKey === "free";
}
