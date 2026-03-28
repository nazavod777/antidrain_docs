const ROOT_REDIRECT_TARGETS = {
  "/": "/getting-started",
  "/ru": "/ru/getting-started"
} as const satisfies Record<string, string>;

export function getRedirectTargetPathname(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/u, "") || "/";
  return ROOT_REDIRECT_TARGETS[
    normalizedPath as keyof typeof ROOT_REDIRECT_TARGETS
  ] ?? null;
}
