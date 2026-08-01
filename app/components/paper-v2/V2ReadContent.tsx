import classes from "./paper-v2-read.module.css";

interface V2ReadContentProps {
  content?: string | null;
  className?: string;
  emptyPlaceholder?: string;
}

export function V2ReadContent({
  content,
  className,
  emptyPlaceholder = "—",
}: V2ReadContentProps) {
  const text = content?.trim() ?? "";
  const rootClass = [classes.root, className].filter(Boolean).join(" ");

  if (!text) {
    return (
      <div className={[rootClass, classes.empty].filter(Boolean).join(" ")}>
        {emptyPlaceholder}
      </div>
    );
  }

  return <div className={rootClass}>{content}</div>;
}
