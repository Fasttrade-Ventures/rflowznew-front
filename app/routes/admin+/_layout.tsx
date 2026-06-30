import { requireAdmin } from "#app/services/authentication.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireAdmin({ request });
  console.log("user :>> ", user);
  return null;
};

export default function AdminLayoutPage() {
  return <Outlet />;
}
