import { ReactNode } from "react";

import classes from "./v2.module.css";

export function PaperScreenHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 8,
      }}
    >
      <div>
        <div className={classes.screenTitle}>{title}</div>
        {subtitle && <div className={classes.screenSub}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}

export function PaperPanel({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={classes.panel}>
      {(title || actions) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div>
            {title && (
              <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
            )}
            {subtitle && (
              <div className={classes.screenSub}>{subtitle}</div>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={classes.statCard}>
      <span className={classes.statLabel}>{label}</span>
      <span
        className={classes.statValue}
        style={accent ? { color: "var(--rz-primary)" } : undefined}
      >
        {value}
      </span>
      {sub && <span className={classes.statSub}>{sub}</span>}
    </div>
  );
}

export function GuideBanner({ children }: { children: ReactNode }) {
  return <div className={classes.guideBanner}>{children}</div>;
}

export function ProfZBanner({
  message,
}: {
  message: string;
}) {
  return (
    <div className={classes.profZ}>
      <div className={classes.profZAvatar} />
      <div>
        <div className={classes.profZName}>Prof Z</div>
        <div className={classes.profZText}>{message}</div>
      </div>
    </div>
  );
}
