import { Toast } from "#app/utils/toast.server";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";

export function useToast(toast?: Toast | null) {
  useEffect(() => {
    if (toast) {
      setTimeout(() => {
        notifications.show({
          withCloseButton: true,
          id: toast.id,
          title: toast.title,
          message: toast.description,
          color:
            toast.type === "success"
              ? "green"
              : toast.type === "error"
              ? "red"
              : "blue",
        });
      }, 0);
    }
  }, [toast]);
}
