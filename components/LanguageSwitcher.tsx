"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { locales } from "@/lib/i18n/translations";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--foreground)]/60 hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors w-full"
      >
        <span>{current.flag}</span>
        <span className="text-xs font-medium">{current.label}</span>
        <span className="ml-auto text-xs opacity-50">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-20 overflow-hidden">
            {locales.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-2)] ${
                  l.code === locale ? "text-[var(--accent)] font-semibold" : "text-[var(--foreground)]/70"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
                {l.code === locale && <span className="ml-auto text-xs">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
