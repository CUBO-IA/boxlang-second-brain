import type { Language } from "../lib/types";

export function LogoMark({ size = 32, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={inverse ? "#fefce8" : "#134e4a"} />
      <path d="M10 11l12 2M10 11l5 11M22 13l-7 9" stroke={inverse ? "#0d9488" : "#5eead4"} strokeWidth="1.8" fill="none" />
      <circle cx="10" cy="11" r="3" fill={inverse ? "#0d9488" : "#5eead4"} />
      <circle cx="22" cy="13" r="3" fill={inverse ? "#134e4a" : "#fefce8"} />
      <circle cx="15" cy="22" r="3" fill="#14b8a6" />
    </svg>
  );
}

export function LanguageSwitch({
  language,
  onChange,
  inverse = false,
}: {
  language: Language;
  onChange: (next: Language) => void;
  inverse?: boolean;
}) {
  return (
    <div className={inverse ? "language-switch inverse" : "language-switch"} role="group" aria-label={language === "es" ? "Idioma" : "Language"}>
      <button type="button" aria-pressed={language === "es"} aria-label="Español" onClick={() => onChange("es")}>ES</button>
      <button type="button" aria-pressed={language === "en"} aria-label="English" onClick={() => onChange("en")}>EN</button>
    </div>
  );
}
