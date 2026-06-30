import { Code, Stack, Button, Text } from "@mantine/core";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const cloudflareRes = await fetch(`${process.env.API_HOST}/cdn-cgi/trace`);
    const cloudflareText = await cloudflareRes.text();
    const flyRegion = process.env.FLY_REGION || "Not running on Fly.io";
    const appUrl = process.env.APP_URL || "http://takset";

    console.log("Cloudflare info:", cloudflareText);
    console.log("Fly region:", flyRegion);

    return json({
      cloudflareText,
      flyRegion,
      domain: process.env.API_HOST,
      appUrl,
    });
  } catch (error) {
    console.error(`Error: ${error}`);
    return json({
      cloudflareText: "",
      flyRegion: process.env.FLY_REGION || "Not running on Fly.io",
      domain: process.env.API_HOST,
      appUrl: process.env.APP_URL || "http://takset",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const startTime = performance.now();

  try {
    const response = await fetch(`${process.env.API_HOST}/check-cloudflare`, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    const status = response.ok ? "OK" : "Error";

    return json({
      status,
      latency,
      timestamp: new Date().toISOString(),
      error: null,
    });
  } catch (error) {
    return json({
      status: "Error",
      latency: 999,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
};

const CheckCloudflare = () => {
  const { cloudflareText, flyRegion, domain, appUrl } =
    useLoaderData<typeof loader>();
  const pingFetcher = useFetcher<typeof action>();

  const isPinging = pingFetcher.state === "submitting";
  const pingResult = pingFetcher.data;

  return (
    <Stack gap="xs">
      <div>Domain: {domain}</div>
      <div>Fly.io Region: {flyRegion}</div>
      <div>App URL: {appUrl}</div>
      <Code block>{cloudflareText}</Code>

      <Stack gap="xs">
        <Button
          loading={isPinging}
          onClick={() => pingFetcher.submit(null, { method: "post" })}
        >
          Test API Latency
        </Button>

        {pingResult && pingResult.status !== "error" && (
          <Code block>
            Status: {pingResult.status}
            {pingResult.latency && `\nLatency: ${pingResult.latency}ms`}
            {pingResult.error && `\nError: ${pingResult.error}`}
            {`\nTimestamp: ${pingResult.timestamp}`}
          </Code>
        )}
      </Stack>
    </Stack>
  );
};

export default CheckCloudflare;
