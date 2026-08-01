import { Button } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { ReactNode } from "react";

import formClasses from "./paper-v2-form.module.css";

type FormSaveFooterProps = {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  before?: ReactNode;
};

export function FormSaveFooter({
  children,
  loading,
  disabled,
  type = "submit",
  onClick,
  before,
}: FormSaveFooterProps) {
  const isMobile = useMediaQuery("(max-width: 62em)");

  return (
    <div className={formClasses.formFooter}>
      {before}
      <Button
        type={type}
        size="sm"
        loading={loading}
        disabled={disabled}
        onClick={onClick}
        fullWidth={isMobile}
      >
        {children}
      </Button>
    </div>
  );
}
