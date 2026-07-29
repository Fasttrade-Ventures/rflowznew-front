import { Paper } from "@mantine/core";
import { loader as rootLoader } from "#app/root";
import { Outlet } from "@remix-run/react";
import { useRouteLoaderData } from "@remix-run/react";

import classes from "./authPage.module.css";

const AuthLayout = () => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const isV2 = rootData?.paperV2Flow;

  if (isV2) {
    return (
      <div className={classes.v2Wrapper}>
        <Paper className={classes.v2Paper} radius="md" p={32}>
          <Outlet />
        </Paper>
        <div className={classes.v2HeroImage} aria-hidden />
      </div>
    );
  }

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.paper} radius={0} p={30}>
        <div className={classes.logo} />
        <Outlet />
      </Paper>
    </div>
  );
};

export default AuthLayout;
