const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  standard: "Standard",
  professional: "Professional",
};

export function hasPlanAccess(
  subscriptionStatus: string | null | undefined
): boolean {
  return (
    subscriptionStatus === "active" || subscriptionStatus === "trialing"
  );
}

export function isFreePlan(planKey: string | null | undefined): boolean {
  return !planKey || planKey === "free";
}

export function getPlanDisplayLabel(
  planKey: string | null | undefined,
  subscriptionStatus: string | null | undefined
): string {
  const base =
    (planKey && PLAN_LABELS[planKey]) ||
    (hasPlanAccess(subscriptionStatus) ? "Paid" : "Free");

  if (subscriptionStatus === "trialing") {
    return `${base} Trial`;
  }

  return base;
}

/** Prefer a real first name; avoid demo placeholder names like "Free Demo User". */
export function displayFirstName(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    return email?.split("@")[0] ?? "there";
  }

  if (/^free\s+demo\b/i.test(trimmed)) {
    const fromEmail = email?.split("@")[0];
    if (fromEmail) {
      return fromEmail
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
    return "Demo";
  }

  return trimmed.split(/\s+/)[0] ?? "there";
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
