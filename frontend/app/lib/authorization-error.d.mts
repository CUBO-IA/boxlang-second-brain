export type AuthorizationHandlers = {
  onSessionExpired: () => void;
  onForbidden: () => void;
};

export function handleAuthorizationFailure(
  error: unknown,
  isCurrent: () => boolean,
  handlers: AuthorizationHandlers,
): boolean;
