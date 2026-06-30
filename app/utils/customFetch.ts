import { invariant } from "@epic-web/invariant";
import { APIValidationError } from "./error/api-validation-error";
import { authenticator } from "#app/services/auth.server";
import { getSession } from "#app/services/session.server";

export interface FetchProps {
  request?: Request;
  method: "get" | "post" | "put" | "delete" | "patch";
  url: string;
  data?: BodyInit | null | undefined;
  contentType?: string;
  includeContentType?: boolean;
}

export interface FetchResponse<T> {
  data?: T;
}
const customFetch = async <T>({
  request,
  url,
  method,
  data,
  contentType = "application/json",
  includeContentType = true,
}: FetchProps): Promise<FetchResponse<T>> => {
  const session = await getSession(request?.headers.get("Cookie"));
  const token = session.data?.user?.token;

  console.log("PROCESING API REQUEST", {
    url,
    method,
    data,
    contentType,
    includeContentType,
  });

  const response = await fetch(`${process.env.API_HOST}${url}`, {
    method,
    headers: new Headers({
      ...(includeContentType && { "Content-Type": contentType }),
      ...(token && { Authorization: "Bearer " + token }),
      Accept: "application/json",
    }),
    body: data,
  });

  let result: T | undefined;

  if (response.status === 204) {
    // No Content response
    result = undefined;
  } else {
    result = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) {
      invariant(request, "request is required");
      const theUrl = new URL(request.url);
      const redirectToUrl = request
        ? theUrl.href.replace(theUrl.origin, "")
        : "/";

      return authenticator.logout(request, {
        redirectTo: `/login?redirectTo=${redirectToUrl}`,
      });
    }

    throw new APIValidationError(response.status, response.statusText, result);
  }

  return { data: result };
};

export default customFetch;
