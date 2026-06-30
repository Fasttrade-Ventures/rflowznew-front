import { sleep } from "#app/utils/misc";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import React from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await sleep(2000);
  return null;
};

export default function Test() {
  return (
    <div>
      <Link to="/">Home</Link>
    </div>
  );
}
