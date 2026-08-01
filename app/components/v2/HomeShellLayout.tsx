import { Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ReactNode, useEffect } from "react";
import { useLocation } from "@remix-run/react";

import { AppHeaderV2 } from "./AppHeaderV2";
import { AppSidebarV2 } from "./AppSidebarV2";
import classes from "./v2.module.css";

export function HomeShellLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const { pathname } = useLocation();

  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <div className={`rz-v2 ${classes.shell}`}>
      {opened ? (
        <button
          type="button"
          className={classes.sidebarBackdrop}
          aria-label="Close menu"
          onClick={close}
        />
      ) : null}

      <div className={classes.sidebarWrap} data-open={opened || undefined}>
        <AppSidebarV2 onNavigate={close} />
      </div>

      <div className={classes.main}>
        <div className={classes.mainHeader}>
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="lg"
            size="sm"
            aria-label="Toggle navigation menu"
          />
          <div className={classes.mainHeaderInner}>
            <AppHeaderV2 />
          </div>
        </div>
        <main className={classes.content}>{children}</main>
      </div>
    </div>
  );
}
