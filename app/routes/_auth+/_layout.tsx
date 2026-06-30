import { Paper } from "@mantine/core";
import classes from "./authPage.module.css";
import { Outlet } from "@remix-run/react";

const AuthLayout = () => {
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
