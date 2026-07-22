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

export function canManageStripeBilling(
  subscription:
    | {
        can_manage_billing?: boolean;
        billing_provider?: string;
      }
    | null
    | undefined
): boolean {
  return subscription?.can_manage_billing === true;
}
