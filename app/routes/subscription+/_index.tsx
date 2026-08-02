import { updateUserSubscriptionStatus } from "#app/services/auth.server";
import {
  getCurrentUser,
  requireAuth,
} from "#app/services/authentication.server";
import {
  createStripePortalSession,
  createSubscription,
  getSubscriptions,
  getCurrentUserSubscription,
} from "#app/services/subscription.server";
import { redirectWithToast } from "#app/utils/toast.server";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  List,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import {
  PageBreadcrumb,
  PlanCardV2,
} from "#app/components/v2/V2UIKit";
import v2classes from "#app/components/v2/v2.module.css";
import { loader as rootLoader } from "#app/root";
import { useRouteLoaderData } from "@remix-run/react";
import { APIValidationError } from "#app/utils/error/api-validation-error";
import { canManageStripeBilling, isFreePlan } from "#app/utils/plan";
import { Icon } from "#app/components/icon";
import { BreadcrumbHandle } from "../_index";
import classes from "./_index.module.css";

export const handle: BreadcrumbHandle = {
  breadcrumb: "Subscription",
  icon: <Icon name="pika-wallet" style={{ width: "20px", height: "20px" }} />,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  const userRes = await getCurrentUser({ request });
  const subscriptionRes = await getCurrentUserSubscription({ request });

  if (
    user.subscription_status !== userRes.data?.subscription_status ||
    user.plan_key !== userRes.data?.plan_key
  ) {
    const newCookie = await updateUserSubscriptionStatus(
      request,
      userRes.data?.subscription_status || null,
      userRes.data?.plan_key ?? null
    );
    if (newCookie) {
      return redirectWithToast(
        ".",
        {
          title: "Subscription status synced successfully",
          description: "Your subscription status has been updated.",
          type: "success",
        },
        {
          headers: {
            "Set-Cookie": newCookie,
          },
        }
      );
    }
    return redirect(".");
  }

  const url = new URL(request.url);
  const billingPeriod = url.searchParams.get("billingPeriod") || "yearly";
  let message = null;
  const status = url.searchParams.get("status");

  if (status === "cancel") {
    message = "Please choose a plan to subscribe";
  }

  const res = await getSubscriptions({ request });

  return json({
    billingPeriod,
    subscriptions: res.data?.subscriptions,
    message,
    subscription_status: user.subscription_status,
    currentPlanKey:
      subscriptionRes.data?.subscription?.plan_key ??
      subscriptionRes.data?.features?.plan_key ??
      null,
    canManageBilling: canManageStripeBilling(
      subscriptionRes.data?.subscription
    ),
    hasUsedTrial:
      subscriptionRes.data?.subscription?.status === "trialing" ||
      subscriptionRes.data?.subscription?.status === "inactive",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "subscribe") {
    const planName = formData.get("plan_name") as string;
    const stripePrice = formData.get("stripe_price") as string;
    const originalExportMonthlyLimit = formData.get(
      "original_export_monthly_limit"
    ) as string;
    const isTrial = formData.get("is_trial") === "true";

    const res = await createSubscription({
      request,
      planName,
      stripePrice,
      originalExportMonthlyLimit,
      isTrial,
    });

    return redirect(res.data?.checkout_url || "/");
  }

  if (actionType === "manageSubscription") {
    try {
      const res = await createStripePortalSession({ request });
      if (res.data?.url) {
        return redirect(res.data.url);
      }
    } catch (error) {
      if (error instanceof APIValidationError) {
        return redirectWithToast("/subscription", {
          type: "error",
          title: "Billing portal unavailable",
          description:
            "Billing can only be managed for subscriptions purchased through Stripe.",
        });
      }

      throw error;
    }

    return redirectWithToast("/subscription", {
      type: "error",
      title: "Billing portal unavailable",
      description: "Unable to open the billing portal right now.",
    });
  }

  return null;
};

export const SubscriptionPage = () => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const data = useLoaderData<typeof loader>();

  if (rootData?.paperV2Flow) {
    return <SubscriptionV2 {...data} />;
  }

  return <SubscriptionLegacy {...data} />;
};

function SubscriptionV2({
  billingPeriod,
  subscriptions,
  message,
  subscription_status,
  currentPlanKey,
  hasUsedTrial,
  canManageBilling,
}: ReturnType<typeof useLoaderData<typeof loader>>) {
  const navigate = useNavigate();
  const plans = subscriptions || [];
  const onFreePlan = isFreePlan(currentPlanKey);
  const hasPaidAccess =
    (subscription_status === "active" || subscription_status === "trialing") &&
    !onFreePlan;

  const handleBillingPeriodChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    navigate(`?billingPeriod=${event.target.checked ? "yearly" : "monthly"}`);
  };

  return (
    <div className={v2classes.subscriptionPage}>
      <PageBreadcrumb>Home → Subscription</PageBreadcrumb>
      {message && <Alert color="red">{message}</Alert>}
      <div className={v2classes.subscriptionHeader}>
        <div className={v2classes.subscriptionTitle}>Choose Your Plan</div>
        <Text size="xs" c="dimmed">
          Toggle monthly or yearly billing
        </Text>
      </div>
      <div className={v2classes.billingToggle}>
        <Text size="sm" c={billingPeriod === "monthly" ? undefined : "dimmed"}>
          Monthly
        </Text>
        <Switch
          checked={billingPeriod === "yearly"}
          onChange={handleBillingPeriodChange}
          size="sm"
        />
        <Text size="sm" fw={billingPeriod === "yearly" ? 500 : undefined}>
          Yearly
        </Text>
      </div>
      <div className={v2classes.planGrid}>
        {plans.map((plan) => {
          const recommended =
            plan.isRecommended[billingPeriod as "monthly" | "yearly"];
          return (
            <PlanCardV2
              key={plan.title.label}
              name={plan.title.label}
              description={plan.description}
              highlighted={recommended}
              price={
                plan.isFree ? (
                  <Text fz={28} fw={700}>
                    Free
                  </Text>
                ) : (
                  <Text fz={28} fw={700}>
                    ${plan.price[billingPeriod as "monthly" | "yearly"]}
                  </Text>
                )
              }
              priceNote={
                !plan.isFree && billingPeriod === "yearly"
                  ? "/month (billed annually)"
                  : !plan.isFree
                    ? "/month"
                    : undefined
              }
              features={
                <List spacing={6} size="sm" icon={<CheckIcon />}>
                  {plan.features.map((feature) => (
                    <List.Item key={feature}>
                      <Text size="xs">{feature}</Text>
                    </List.Item>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <List.Item key={feature} icon={<CrossIcon />}>
                      <Text size="xs" c="dimmed">
                        {feature}
                      </Text>
                    </List.Item>
                  ))}
                </List>
              }
              cta={
                plan.isFree ? (
                  onFreePlan ? (
                    <Button fullWidth size="xs" variant="outline" disabled>
                      Current plan
                    </Button>
                  ) : (
                    <Text size="xs" c="dimmed" ta="center">
                      Included for all new accounts
                    </Text>
                  )
                ) : subscription_status === null ||
                  subscription_status === "inactive" ||
                  onFreePlan ? (
                  <SubscribeButton
                    planName={plan.title[billingPeriod as "monthly" | "yearly"]}
                    stripePrice={
                      plan.stripePriceId[billingPeriod as "monthly" | "yearly"]!
                    }
                    originalExportMonthlyLimit={plan.original_export_monthly_limit.toString()}
                    hasUsedTrial={hasUsedTrial}
                  />
                ) : canManageBilling ? (
                  <ManageSubscriptionButton
                    planName={plan.title[billingPeriod as "monthly" | "yearly"]}
                  />
                ) : (
                  <Button fullWidth size="xs" disabled>
                    Current plan
                  </Button>
                )
              }
              footer={undefined}
            />
          );
        })}
      </div>
      <div className={v2classes.subscriptionDisclaimer}>
        RflowZ is designed to assist users in developing research proposals
        utilizing Design Science Research (DSR) principles.
      </div>
    </div>
  );
}

function SubscriptionLegacy({
  billingPeriod,
  subscriptions,
  message,
  subscription_status,
  currentPlanKey,
  hasUsedTrial,
  canManageBilling,
}: ReturnType<typeof useLoaderData<typeof loader>>) {
  const navigate = useNavigate();

  const plans = subscriptions || [];
  const onFreePlan = isFreePlan(currentPlanKey);
  const hasPaidAccess =
    (subscription_status === "active" || subscription_status === "trialing") &&
    !onFreePlan;

  const handleBillingPeriodChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newBillingPeriod = event.target.checked ? "yearly" : "monthly";
    navigate(`?billingPeriod=${newBillingPeriod}`);
  };

  return (
    <Container size={1200} py="xl">
      {message && (
        <Alert color="red" mb="xl">
          {message}
        </Alert>
      )}

      <Title order={2} ta="center" mb="xl">
        Choose Your Plan
      </Title>

      <Group justify="center" mb="xl" gap="xs">
        <Text size="sm" component={Link} to={`?billingPeriod=monthly`}>
          Monthly
        </Text>
        <Switch
          checked={billingPeriod === "yearly"}
          onChange={handleBillingPeriodChange}
        />
        <Text size="sm" component={Link} to={`?billingPeriod=yearly`}>
          Yearly
        </Text>
      </Group>

      <Grid align="stretch">
        {plans.map((plan) => (
          <Grid.Col
            key={plan.title.label}
            span={{ base: 12, sm: 6, lg: 3 }}
            className={classes.cardCol}
          >
            <Card
              shadow="sm"
              p="lg"
              className={`${classes.card} ${
                plan.isRecommended[billingPeriod as "monthly" | "yearly"]
                  ? classes.recommended
                  : ""
              }`}
            >
              <Group
                align="center"
                my="md"
                justify="space-between"
                wrap="nowrap"
              >
                <Title order={4}>{plan.title.label}</Title>
                {plan.isRecommended[billingPeriod as "monthly" | "yearly"] && (
                  <Badge
                    color="var(--mantine-primary-color-6)"
                    variant="filled"
                    size="xs"
                  >
                    Recommended
                  </Badge>
                )}
              </Group>
              <Text size="xs">{plan.description}</Text>

              <Group mt="md" wrap="nowrap" gap={5}>
                {plan.isFree ? (
                  <Text fz={30} fw={700}>
                    Free
                  </Text>
                ) : (
                  <>
                    <Text fz={30} fw={700}>
                      ${plan.price[billingPeriod as "monthly" | "yearly"]}
                    </Text>
                    <Text size="sm" fz={10} c="dimmed">
                      /month {billingPeriod === "yearly" && "(Billed Annually)"}
                    </Text>
                  </>
                )}
              </Group>

              <List
                spacing="sm"
                size="sm"
                center
                icon={<CheckIcon />}
                mt="md"
                className={classes.featureList}
              >
                {plan.features.map((feature) => (
                  <List.Item key={feature}>
                    <Text size="xs">{feature}</Text>
                  </List.Item>
                ))}
                {plan.notIncluded.map((feature) => (
                  <List.Item key={feature} icon={<CrossIcon />}>
                    <Text size="xs">{feature}</Text>
                  </List.Item>
                ))}
              </List>

              <div className={classes.cardFooter}>
              {plan.isFree ? (
                onFreePlan ? (
                  <Button fullWidth disabled>
                    Current plan
                  </Button>
                ) : hasPaidAccess ? null : (
                  <Text size="xs" c="dimmed" ta="center">
                    Included for all new accounts
                  </Text>
                )
              ) : subscription_status === null ||
                subscription_status === "inactive" ||
                onFreePlan ? (
                <SubscribeButton
                  planName={plan.title[billingPeriod as "monthly" | "yearly"]}
                  stripePrice={
                    plan.stripePriceId[billingPeriod as "monthly" | "yearly"]!
                  }
                  originalExportMonthlyLimit={plan.original_export_monthly_limit.toString()}
                  hasUsedTrial={hasUsedTrial}
                />
              ) : canManageBilling ? (
                <ManageSubscriptionButton
                  planName={plan.title[billingPeriod as "monthly" | "yearly"]}
                />
              ) : (
                <Button fullWidth disabled>
                  Current plan
                </Button>
              )}
              </div>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}

const ManageSubscriptionButton = ({ planName }: { planName: string }) => {
  const navigation = useNavigation();
  const manageSubscriptionLoading =
    navigation.state !== "idle" &&
    navigation.formData?.get("actionType") === "manageSubscription" &&
    navigation.formData?.get("plan_name") === planName;
  return (
    <Form method="post">
      <input type="hidden" name="plan_name" value={planName} />
      <input type="hidden" name="actionType" value="manageSubscription" />
      <Stack gap={5} align="center">
        <Button
          fullWidth
          type="submit"
          loading={manageSubscriptionLoading}
        >
          Manage Subscription
        </Button>
      </Stack>
    </Form>
  );
};

const SubscribeButton = ({
  planName,
  stripePrice,
  originalExportMonthlyLimit,
  hasUsedTrial,
}: {
  planName: string;
  stripePrice: string;
  originalExportMonthlyLimit: string;
  hasUsedTrial: boolean;
}) => {
  const navigation = useNavigation();
  const isLoading =
    navigation.state === "submitting" &&
    navigation.formData?.get("plan_name") === planName;
  return (
    <Form method="post">
      <input type="hidden" name="actionType" value="subscribe" />
      <input type="hidden" name="plan_name" value={planName} />
      <input type="hidden" name="stripe_price" value={stripePrice} />
      <input
        type="hidden"
        name="original_export_monthly_limit"
        value={originalExportMonthlyLimit}
      />
      <input
        type="hidden"
        name="is_trial"
        value={(!hasUsedTrial).toString()}
      />
      <Stack gap={5} align="center">
        <Button fullWidth type="submit" loading={isLoading}>
          {hasUsedTrial ? "Subscribe now" : "Free 5-day trial"}
        </Button>
        {!hasUsedTrial && (
          <Text size="xs" c="dimmed">
            No credit card required for the trial.
          </Text>
        )}
      </Stack>
    </Form>
  );
};

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const CrossIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default SubscriptionPage;
