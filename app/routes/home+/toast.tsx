import { redirectWithToast } from "#app/utils/toast.server";

export const loader = async () => {
  return redirectWithToast("/", {
    title: "Connected",
    type: "success",
    description: `bla bla bla`,
  });
};

export default function ToastTest() {
  return <div>ToastTest</div>;
}
