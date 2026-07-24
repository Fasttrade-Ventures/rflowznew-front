import { useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import { Message } from "ably";
import { useRouteLoaderData } from "@remix-run/react";
import type { loader as rootLoader } from "#app/root";

const useAbly = (
  paperId: string | undefined,
  ablyEventName: string,
  onMessage: (message: Message) => void,
  channelPrefix = "paper"
) => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const ablyKey = rootData?.ablyKey;
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const setupAbly = useCallback(() => {
    if (!ablyKey || !paperId || ablyRef.current) return;

    ablyRef.current = new Ably.Realtime({
      key: ablyKey,
      clientId: `rflowz-${paperId}`,
    });

    ablyRef.current.connection.once("connected", () => {
      channelRef.current = ablyRef.current!.channels.get(
        `${channelPrefix}-${paperId}`
      );

      if (channelRef.current) {
        channelRef.current.subscribe(ablyEventName, (message) => {
          onMessageRef.current(message);
        });
      }
    });
  }, [ablyKey, paperId, ablyEventName, channelPrefix]);

  useEffect(() => {
    setupAbly();
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (ablyRef.current) {
        ablyRef.current.connection.off();
        ablyRef.current.close();
        ablyRef.current = null;
      }
    };
  }, [setupAbly]);

  return { ablyRef, channelRef };
};

export default useAbly;
