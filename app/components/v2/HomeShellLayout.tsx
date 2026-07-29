import { ReactNode } from "react";

import { AppHeaderV2 } from "./AppHeaderV2";
import { AppSidebarV2 } from "./AppSidebarV2";
import classes from "./v2.module.css";

export function HomeShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`rz-v2 ${classes.shell}`}>
      <AppSidebarV2 />
      <div className={classes.main}>
        <AppHeaderV2 />
        <main className={classes.content}>{children}</main>
      </div>
    </div>
  );
}
