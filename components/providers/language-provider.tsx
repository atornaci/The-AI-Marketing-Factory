"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    type Language,
    type Translations,
    type LanguageInfo,
    getTranslations,
    getLanguageInfo,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
} from "@/lib/i18n/translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
    languageInfo: LanguageInfo;
    supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
    const [t, setTranslations] = useState<Translations>(getTranslations(DEFAULT_LANGUAGE));

    // Load saved language from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("amf-language") as Language | null;
        if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
            setLanguageState(saved);
            setTranslations(getTranslations(saved));
        }
    }, []);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        setTranslations(getTranslations(lang));
        localStorage.setItem("amf-language", lang);
        // Update HTML dir and lang attributes
        document.documentElement.lang = lang;
    }, []);

    const languageInfo = getLanguageInfo(language);

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
                t,
                languageInfo,
                supportedLanguages: SUPPORTED_LANGUAGES,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE };
export type { Language, LanguageInfo };
