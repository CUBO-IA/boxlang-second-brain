import { useEffect, useSyncExternalStore } from "react";

import type { Language } from "./types";

const storageKey = "terengue-language";
const changeEvent = "terengue-language-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

function readLanguage(): Language {
  try {
    return window.localStorage.getItem(storageKey) === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

export function useLanguage(): [Language, (next: Language) => void] {
  const language = useSyncExternalStore(subscribe, readLanguage, () => "es" as Language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function setLanguage(next: Language) {
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Without storage the choice simply does not persist.
    }
    window.dispatchEvent(new Event(changeEvent));
  }

  return [language, setLanguage];
}
