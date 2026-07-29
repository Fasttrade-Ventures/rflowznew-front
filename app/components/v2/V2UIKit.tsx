import { Button } from "@mantine/core";
import { Link } from "@remix-run/react";
import type { ReactNode } from "react";

import classes from "./v2.module.css";

export function PageBreadcrumb({ children }: { children: ReactNode }) {
  return <div className={classes.breadcrumb}>{children}</div>;
}

export function PageTitleBlock({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={classes.pageHeaderRow}>
      <div>
        <div className={classes.pageTitleLarge}>{title}</div>
        {subtitle && <div className={classes.pageSub}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}

export function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className={classes.statPill}>
      <span className={classes.statPillLabel}>{label}</span>
      <span
        className={classes.statPillValue}
        style={accent ? { color: "var(--rz-primary)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function V2Card({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${classes.v2Card}${className ? ` ${className}` : ""}`}>
      {title && <div className={classes.v2CardTitle}>{title}</div>}
      {subtitle && <div className={classes.v2CardSub}>{subtitle}</div>}
      {children}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  emptyMessage = "No data yet.",
}: {
  columns: { key: string; label: string; width?: string; align?: "left" | "right" }[];
  rows: { id: string; cells: Record<string, ReactNode> }[];
  emptyMessage?: string;
}) {
  return (
    <div className={classes.dataTable}>
      <div className={classes.dataTableHeader}>
        {columns.map((col) => (
          <div
            key={col.key}
            className={classes.dataTableCell}
            style={{
              flex: col.width ? `0 0 ${col.width}` : "1 1 0",
              textAlign: col.align ?? "left",
            }}
          >
            {col.label}
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className={classes.dataTableEmpty}>{emptyMessage}</div>
      ) : (
        rows.map((row) => (
          <div key={row.id} className={classes.dataTableRow}>
            {columns.map((col) => (
              <div
                key={col.key}
                className={classes.dataTableCell}
                style={{
                  flex: col.width ? `0 0 ${col.width}` : "1 1 0",
                  textAlign: col.align ?? "left",
                }}
              >
                {row.cells[col.key]}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export function WizardSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className={classes.wizardSteps}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span
            key={step}
            className={
              active
                ? classes.wizardStepActive
                : done
                  ? classes.wizardStepDone
                  : classes.wizardStepInactive
            }
          >
            {done ? `✓ ${step.replace(/^\d+\.\s*/, "")}` : step}
          </span>
        );
      })}
    </div>
  );
}

export function WizardShell({
  steps,
  currentStep,
  children,
}: {
  steps: string[];
  currentStep: number;
  children: ReactNode;
}) {
  return (
    <div className={classes.wizardCenter}>
      <div className={classes.wizardCard}>
        <WizardSteps steps={steps} current={currentStep} />
        <div className={classes.wizardDivider} />
        {children}
      </div>
    </div>
  );
}

export function PurposeCard({
  title,
  description,
  badge,
  active,
  to,
}: {
  title: string;
  description: string;
  badge?: string;
  active?: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={`${classes.purposeCard}${active ? ` ${classes.purposeCardActive}` : ""}`}
    >
      <div className={classes.purposeCardTop}>
        <span className={classes.purposeCardTitle}>{title}</span>
        {badge && <span className={classes.purposeBadge}>{badge}</span>}
      </div>
      <span className={classes.purposeCardDesc}>{description}</span>
    </Link>
  );
}

export function PlanCardV2({
  name,
  description,
  price,
  priceNote,
  features,
  cta,
  highlighted,
  footer,
}: {
  name: string;
  description: string;
  price: ReactNode;
  priceNote?: string;
  features: ReactNode;
  cta: ReactNode;
  highlighted?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div
      className={`${classes.planCard}${highlighted ? ` ${classes.planCardHighlight}` : ""}`}
    >
      <div className={classes.planCardHeader}>
        <span className={classes.planCardName}>{name}</span>
      </div>
      <p className={classes.planCardDesc}>{description}</p>
      <div className={classes.planCardPrice}>
        {price}
        {priceNote && <span className={classes.planCardPriceNote}>{priceNote}</span>}
      </div>
      <div className={classes.planCardFeatures}>{features}</div>
      {cta}
      {footer}
    </div>
  );
}

export function ToolbarRow({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className={classes.toolbarRow}>
      <div>{left}</div>
      <div className={classes.toolbarRight}>{right}</div>
    </div>
  );
}

export function OutlineButton({
  children,
  to,
  onClick,
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
}) {
  if (to) {
    return (
      <Button component={Link} to={to} variant="outline" size="xs">
        {children}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="xs" onClick={onClick}>
      {children}
    </Button>
  );
}
