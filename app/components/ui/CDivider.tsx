import { Divider } from "@mantine/core";
import classes from "./CDivider.module.css";

interface CDividerProps {
  my?: string;
  darkColor?: string;
  lightColor?: string;
}

export const CDivider = ({
  my = "sm",
  darkColor = "var(--mantine-color-dark-8)",
  lightColor = "var(--mantine-color-gray-2)",
}: CDividerProps) => {
  return (
    <Divider
      my={my}
      style={{
        "--divider-color-dark": darkColor,
        "--divider-color-light": lightColor,
      }}
      className={classes.divider}
    />
  );
};

export default CDivider;
