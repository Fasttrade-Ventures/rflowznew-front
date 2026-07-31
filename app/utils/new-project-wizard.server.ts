import { createCookie } from "@remix-run/node";

import type { NewProjectDraft } from "./new-project-wizard";

const wizardDraftCookie = createCookie("rflowz-wizard-draft", {
  httpOnly: true,
  maxAge: 60 * 60,
  sameSite: "lax",
  path: "/",
});

export async function readWizardDraftCookie(
  request: Request
): Promise<NewProjectDraft | null> {
  const raw = await wizardDraftCookie.parse(request.headers.get("Cookie"));
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as NewProjectDraft;
  } catch {
    return null;
  }
}

export async function writeWizardDraftCookie(draft: NewProjectDraft) {
  return wizardDraftCookie.serialize(JSON.stringify(draft));
}

export async function clearWizardDraftCookie() {
  return wizardDraftCookie.serialize("", { maxAge: 0 });
}
