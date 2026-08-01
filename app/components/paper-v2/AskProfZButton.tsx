import classes from "./ask-prof-z-button.module.css";

type AskProfZButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  className?: string;
};

export function AskProfZButton({
  disabled,
  loading,
  onClick,
  className,
}: AskProfZButtonProps) {
  return (
    <div className={`${classes.wrapper} ${className ?? ""}`.trim()}>
      <button
        type="button"
        className={classes.button}
        onClick={onClick}
        disabled={disabled || loading}
      >
        {loading ? "Thinking…" : "Ask Prof Z"}
      </button>
      <img
        src="/images/dr-z.png"
        alt=""
        className={classes.avatar}
        aria-hidden
      />
    </div>
  );
}
