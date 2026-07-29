import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";

import { MermaidPreview } from "./MermaidPreview";
import classes from "./framework-diagram-panel.module.css";

type FrameworkDiagramPanelProps = {
  paperId: string;
  mermaidSource?: string;
  imageUrl?: string | null;
};

export function FrameworkDiagramPanel({
  paperId,
  mermaidSource,
  imageUrl,
}: FrameworkDiagramPanelProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (imageUrl) {
    return (
      <div className={classes.wrap}>
        <img
          src={imageUrl}
          alt="Framework diagram"
          className={classes.image}
        />
        <Link to={`/paper/${paperId}/frameworks`} className={classes.editLink}>
          Edit on Frameworks screen
        </Link>
      </div>
    );
  }

  if (mermaidSource?.trim()) {
    return (
      <div className={classes.wrap}>
        <p className={classes.notice}>
          Source saved — click{" "}
          <Link to={`/paper/${paperId}/frameworks`}>Embed in proposal</Link> on
          Frameworks to lock in the rendered diagram for export.
        </p>
        {isClient ? (
          <MermaidPreview source={mermaidSource} />
        ) : (
          <div className={classes.loading}>Loading diagram preview…</div>
        )}
      </div>
    );
  }

  return (
    <p className={classes.empty}>
      No framework diagram yet.{" "}
      <Link to={`/paper/${paperId}/frameworks`}>Create one on Frameworks</Link>
    </p>
  );
}
