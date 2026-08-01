import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";
import "#app/styles/rflowz-v2.css";
import "#app/styles/paper-v2-mobile.css";
import "@fontsource/poppins/100.css";
import "@fontsource/poppins/200.css";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";

import { ColorSchemeScript, createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { LoaderFunctionArgs } from "@remix-run/node";
import {
  json,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useMatches,
} from "@remix-run/react";

import AppLayout from "./components/AppLayout";
import { HomeShellLayout } from "./components/v2/HomeShellLayout";
import { isPaperV2FlowEnabled } from "./utils/feature-flags.server";
import { GeneralErrorBoundary } from "./components/error-boundary";
import { Icon } from "./components/icon";
import { EpicProgress } from "./components/progress-bar";
import { useToast } from "./components/toaster";
import classes from "./root.module.css";
import { BreadcrumbHandle } from "./routes/_index";
import { useTheme } from "./routes/resources+/theme-switch";
import { getUser, updateUserSubscriptionStatus } from "./services/auth.server";
import { getCurrentUser } from "./services/authentication.server";
import { ClientHintCheck, getHints } from "./utils/client-hints";
import { combineHeaders, getDomainUrl } from "./utils/misc";
import { useNonce } from "./utils/nonce-provider";
import { getTheme, Theme } from "./utils/theme.server";
import { getAblyKey } from "./utils/env.server";
import { getToast } from "./utils/toast.server";

export const handle: BreadcrumbHandle = {
  breadcrumb: "Home",
  icon: <Icon name="sun" style={{ width: "20px", height: "20px" }} />,
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { toast, headers: toastHeaders } = await getToast(request);
  let user = await getUser(request);
  const responseHeaders = combineHeaders(toastHeaders);

  if (user) {
    try {
      const userRes = await getCurrentUser({ request });
      const apiUser = userRes.data;

      if (
        apiUser &&
        (apiUser.subscription_status !== user.subscription_status ||
          apiUser.plan_key !== user.plan_key)
      ) {
        const newCookie = await updateUserSubscriptionStatus(
          request,
          apiUser.subscription_status ?? null,
          apiUser.plan_key ?? null
        );

        if (newCookie) {
          responseHeaders.append("Set-Cookie", newCookie);
        }

        user = {
          ...user,
          subscription_status: apiUser.subscription_status ?? null,
          plan_key: apiUser.plan_key ?? null,
        };
      } else if (apiUser?.plan_key && !user.plan_key) {
        user = { ...user, plan_key: apiUser.plan_key };
      }
    } catch {
      // Keep session user when API refresh fails.
    }
  }

  return json(
    {
      user,
      toast,
      ablyKey: getAblyKey(),
      paperV2Flow: isPaperV2FlowEnabled(),
      selectedTheme: user?.color_theme || "blue",
      scale: user?.scale || "md",
      requestInfo: {
        hints: getHints(request),
        origin: getDomainUrl(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: getTheme(request),
        },
      },
    },
    {
      headers: responseHeaders,
    }
  );
}

function Document({
  children,
  nonce,
  theme = "light",
  selectedTheme = "grape",
  scale = "md",
}: {
  children: React.ReactNode;
  nonce: string;
  theme?: Theme;
  selectedTheme?: string;
  scale?: "xs" | "sm" | "md" | "lg" | "xl";
  env?: Record<string, string>;
  allowIndexing?: boolean;
}) {
  const userScale =
    scale === "xs"
      ? 1
      : scale === "sm"
      ? 1.05625
      : scale === "md"
      ? 1.1125
      : scale === "lg"
      ? 1.16875
      : 1.225;
  const mantineTheme = createTheme({
    scale: userScale,
    fontFamily: "Poppins, sans-serif",
    primaryColor: selectedTheme,
    defaultGradient: {
      from: selectedTheme,
      to: `${selectedTheme}.8`,
      deg: 45,
    },
  });

  return (
    <html lang="en">
      <head>
        <ClientHintCheck nonce={nonce} />
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          property="og:image"
          content="https://app.rflowz.com/images/rflowz-og-image.png"
        />
        <title>Rflowz</title>
        <Links />
      </head>
      <body>
        <MantineProvider forceColorScheme={theme} theme={mantineTheme}>
          <Notifications />
          <div className={classes.container}>{children}</div>

          <EpicProgress />
        </MantineProvider>

        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <ColorSchemeScript forceColorScheme={theme || "light"} />
      </body>
    </html>
  );
}

export default function App() {
  const nonce = useNonce();
  const theme = useTheme();
  const data = useLoaderData<typeof loader>();
  useToast(data.toast);
  const matches = useMatches();
  const isAuthRoute = matches.some((match) =>
    match.id.startsWith("routes/_auth")
  );
  const isPaperRoute = matches.some((match) =>
    match.id.startsWith("routes/paper+/$paperId+")
  );

  return (
    <Document
      nonce={nonce}
      theme={theme}
      selectedTheme={data.selectedTheme}
      scale={data.scale}
    >
      {isAuthRoute || isPaperRoute ? (
        <Outlet />
      ) : data.paperV2Flow ? (
        <HomeShellLayout>
          <Outlet />
        </HomeShellLayout>
      ) : (
        <AppLayout>
          <Outlet />
        </AppLayout>
      )}
    </Document>
  );
}

export function ErrorBoundary() {
  const nonce = useNonce();

  return (
    <Document nonce={nonce}>
      <GeneralErrorBoundary
        statusHandlers={{
          403: ({ error }) => (
            <p>You are not allowed to do that: {error?.data}</p>
          ),
        }}
      />
    </Document>
  );
}

// export function Layout({ children }: { children: React.ReactNode }) {
//   const data = useLoaderData<typeof loader>();
//   return (
//     <html lang="en">
//       <head>
//         <meta charSet="utf-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1" />
//         <Meta />
//         <Links />
//         <ColorSchemeScript />
//       </head>
//       <body>
//         <ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
//         <MantineProvider>{children}</MantineProvider>
//         <ScrollRestoration />
//         <Scripts />
//       </body>
//     </html>
//   );
// }
