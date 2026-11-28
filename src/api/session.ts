// The signed-in profile's session token. It's kept in this browser and sent as a bearer token
// on every request; the API answers 401 when it's missing or no longer valid.

const TOKEN_KEY = "finverse.sessionToken";

/** Fired on window when the API says the session is gone (sign-out elsewhere, expiry). */
export const SESSION_EXPIRED_EVENT = "finverse:session-expired";

export function getSessionToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    memoryToken = null;
  } catch {
    // storage unavailable: the session lasts until the page reloads
    memoryToken = token;
  }
}

export function clearSessionToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable
  }
  memoryToken = null;
}

// Only used when the browser blocks storage, so clearing storage (e.g. from another tab) signs out.
let memoryToken: string | null = null;
export const currentSessionToken = () => getSessionToken() ?? memoryToken;
