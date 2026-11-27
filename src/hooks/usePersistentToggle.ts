import { useCallback, useState } from "react";

const read = (key: string, fallback: boolean) => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : stored === "true";
  } catch {
    return fallback; // storage can be blocked (private mode, disabled site data)
  }
};

/**
 * A boolean that survives page reloads. It only changes when `set` is called (i.e. when the
 * owner flips the switch); nothing resets it on navigation, reload or code reload.
 */
export function usePersistentToggle(key: string, fallback = false): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => read(key, fallback));

  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Not persisted when storage is unavailable; still works for this page load.
      }
    },
    [key]
  );

  return [value, set];
}
