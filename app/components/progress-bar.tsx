import { useNavigation } from "@remix-run/react";
import { useEffect } from "react";
import { useSpinDelay } from "spin-delay";
import {
  NavigationProgress,
  startNavigationProgress,
  setNavigationProgress,
  completeNavigationProgress,
} from "@mantine/nprogress";
import { Loader } from "@mantine/core";

function EpicProgress() {
  const transition = useNavigation();
  const busy = transition.state !== "idle";
  const delayedPending = useSpinDelay(busy, {
    delay: 1500,
    minDuration: 2400,
  });

  useEffect(() => {
    if (busy) {
      startNavigationProgress();
      if (transition.state === "submitting") {
        setNavigationProgress(40);
      } else if (transition.state === "loading") {
        setNavigationProgress(80);
      }
    } else {
      completeNavigationProgress();
    }
  }, [busy, transition.state]);

  return (
    <div
      role="progressbar"
      aria-hidden={delayedPending ? undefined : true}
      aria-valuetext={delayedPending ? "Loading" : undefined}
    >
      <NavigationProgress />
      {/* {delayedPending && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            top: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <Loader size="sm" aria-hidden />
        </div>
      )} */}
    </div>
  );
}

export { EpicProgress };
