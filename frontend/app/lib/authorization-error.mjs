export function handleAuthorizationFailure(error, isCurrent, handlers) {
  if (!isCurrent()) return true;
  if (error?.status === 401) {
    handlers.onSessionExpired();
    return true;
  }
  if (error?.status === 403) {
    handlers.onForbidden();
    return true;
  }
  return false;
}
