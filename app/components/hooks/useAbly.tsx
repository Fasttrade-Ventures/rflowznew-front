import { useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import { Message } from "ably"; // Import the specific type

const useAbly = (
  paperId: string | undefined,
  ablyEventName: string,
  onMessage: (message: Message) => void // Use the imported type
) => {
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  const setupAbly = useCallback(() => {
    if (!ablyRef.current) {
      ablyRef.current = new Ably.Realtime({
        key: "zNWqfQ.szAlPQ:PX_iFFsAaHiCwSXm_chtrHbpPtOP93QTUNslOb1puHw",
        clientId: "your-client-id",
      });

      ablyRef.current.connection.once("connected", () => {
        channelRef.current = ablyRef.current!.channels.get(`paper-${paperId}`);

        if (channelRef.current) {
          channelRef.current.subscribe(ablyEventName, onMessage);
        }
      });
    }
  }, [paperId, ablyEventName, onMessage]);

  useEffect(() => {
    setupAbly();
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (ablyRef.current) {
        ablyRef.current.connection.off(); // Remove all event listeners
        ablyRef.current.close();
        ablyRef.current = null;
      }
    };
  }, [setupAbly]);

  return { ablyRef, channelRef };
};

export default useAbly;
