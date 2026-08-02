import customFetch from "#app/utils/customFetch";

interface Subscription {
  title: {
    label: string;
    monthly: string;
    yearly: string;
  };
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  stripePriceId: {
    monthly: string | null;
    yearly: string | null;
  };
  features: string[];
  notIncluded: string[];
  isRecommended: {
    monthly: boolean;
    yearly: boolean;
  };
  original_export_monthly_limit: number;
  isFree?: boolean;
}

interface SubscriptionResponse {
  success: boolean;
  message: string;
  subscriptions: Subscription[];
}

const getSubscriptions = async ({ request }: { request: Request }) => {
  const res = await customFetch<SubscriptionResponse>({
    request,
    url: "/api/subscription/products",
    method: "get",
  });

  return res;
};

const createSubscription = async ({
  request,
  planName,
  stripePrice,
  originalExportMonthlyLimit,
  isTrial = false,
}: {
  request: Request;
  planName: string;
  stripePrice: string;
  originalExportMonthlyLimit: string;
  isTrial?: boolean;
}) => {
  const res = await customFetch<{ checkout_url: string }>({
    request,
    url: "/api/subscription/create",
    method: "post",
    data: JSON.stringify({
      plan_name: planName,
      stripe_price: stripePrice,
      original_export_monthly_limit: originalExportMonthlyLimit,
      is_trial: isTrial,
    }),
  });

  return res;
};

const confirmSubscription = async ({
  request,
  stripecheckoutSessionId,
}: {
  request: Request;
  stripecheckoutSessionId: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    subscription_status: string;
  }>({
    request,
    url: "/api/subscription/confirm",
    method: "post",
    data: JSON.stringify({
      stripe_checkout_session_id: stripecheckoutSessionId,
    }),
  });

  return res;
};

const createStripePortalSession = async ({ request }: { request: Request }) => {
  const res = await customFetch<{
    success: boolean;
    url: string;
  }>({
    request,
    url: "/api/subscription/create-portal-session",
    method: "get",
  });

  return res;
};

export interface UserSubscription {
  plan_name: string;
  plan_key?: string;
  billing_provider?: string;
  status: string;
  export_limit_remaining: number;
  original_export_monthly_limit: number;
  proposal_limit_remaining?: number;
  proposal_original_monthly_limit?: number;
  ai_limit_remaining?: number;
  ai_original_monthly_limit?: number;
  unlimited_export: boolean;
  watermark_exports?: boolean;
  current_period_end: string | null;
  last_limit_reset: string;
  can_manage_billing?: boolean;
}

export interface PlanFeatures {
  plan_key: string;
  export_docx: boolean;
  export_pdf: boolean;
  export_pptx: boolean;
  watermark_exports: boolean;
  proposal_limit_remaining?: number;
  ai_limit_remaining?: number;
  ai_original_monthly_limit?: number;
  export_limit_remaining?: number;
  unlimited_export: boolean;
  unlimited_proposals?: boolean;
  unlimited_ai?: boolean;
  document_version_limit?: number | null;
}

const getCurrentUserSubscription = async ({
  request,
}: {
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    subscription: UserSubscription | null;
    features?: PlanFeatures;
  }>({
    request,
    url: "/api/subscription/current",
    method: "get",
  });

  return res;
};

export {
  getSubscriptions,
  createSubscription,
  confirmSubscription,
  createStripePortalSession,
  getCurrentUserSubscription,
};
