import { authenticator } from "#app/services/auth.server";
import { redirect, type ActionFunctionArgs } from "@remix-run/node";

export let loader = () => redirect("/login");

export let action = ({ request }: ActionFunctionArgs) => {
  return authenticator.authenticate("google", request);
};
