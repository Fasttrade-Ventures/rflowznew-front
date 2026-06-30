import { Icon } from "#app/components/icon";
import { BreadcrumbHandle } from "#app/routes/_index";
import { Button } from "@mantine/core";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, redirect, useParams } from "@remix-run/react";

export const handle: BreadcrumbHandle = {
  icon: (
    <Icon name="settings-outline" style={{ width: "20px", height: "20px" }} />
  ),
  breadcrumb: "Settings",
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { paperId } = params;
  return redirect(`/paper/${paperId}/settings/edit`);
};

export const SettingsPage = () => {
  const { paperId } = useParams();
  return (
    <div>
      <Button component={Link} to={`/paper/${paperId}/settings/edit`}>
        Edit
      </Button>
    </div>
  );
};

export default SettingsPage;
