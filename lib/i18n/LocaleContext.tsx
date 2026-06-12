"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Locale, type TranslationKey, t, locales } from "./translations";

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  tr: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "nl",
  setLocale: () => {},
  tr: (key) => t.nl[key],
  isRTL: false,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("nl");

  useEffect(() => {
    const stored = localStorage.getItem("artistos_locale") as Locale | null;
    if (stored && t[stored]) setLocaleState(stored);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("artistos_locale", l);
    document.documentElement.dir = locales.find((x) => x.code === l)?.rtl ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }

  useEffect(() => {
    document.documentElement.dir = locales.find((x) => x.code === locale)?.rtl ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  const isRTL = !!locales.find((x) => x.code === locale)?.rtl;
  const tr = (key: TranslationKey) => t[locale][key] ?? t.nl[key];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, tr, isRTL }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
