import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { emailAuthConfigured, hostIdentityTrusted } from "@/lib/auth/config";

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  authProvider?: 'email' | 'google';
};

const USER_ID_HEADER = "oai-authenticated-user-id";
const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_FULL_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";
const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";
// Links go through our own /signin and /signout pages, which check that the host provides ChatGPT sign-in before sending the learner on (see lib/return-to.ts).
const SIGN_IN_PATH = "/signin";
const SIGN_OUT_PATH = "/signout";
const HOST_SIGN_IN_PATH = "/signin-with-chatgpt";
const HOST_SIGN_OUT_PATH = "/signout-with-chatgpt";
const CALLBACK_PATH = "/callback";

/**
 * The signed-in learner for this request, or null. Two modes (see lib/auth/config.ts):
 *  - email mode (a managed auth provider is configured): the learner is the one proven by the provider-verified login cookies. The host's sign-in headers are IGNORED, because on a host that is not OpenAI Sites anyone could send them.
 *  - host mode (no provider configured): the learner is the one the OpenAI Sites host reports in its sign-in headers, as before. Only use this mode on Sites.
 * The function keeps its old name because every account API already calls it.
 */
export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  if (emailAuthConfigured()) {
    const { currentEmailUser } = await import("@/lib/auth/session");
    return currentEmailUser();
  }
  if (!hostIdentityTrusted()) return null;
  const requestHeaders = await headers();
  const userId = requestHeaders.get(USER_ID_HEADER);
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  if (!userId || !email) return null;

  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const fullName =
    encodedFullName &&
    requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName)
      : null;

  return {
    userId,
    displayName: fullName ?? email,
    email,
    fullName,
  };
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === HOST_SIGN_IN_PATH ||
    pathname === HOST_SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email" ||
    pathname === "/auth/confirm" ||
    pathname === "/auth/google/callback" ||
    pathname === "/api/auth/google"
  );
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
