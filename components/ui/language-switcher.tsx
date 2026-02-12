"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import type { Language } from "@/lib/i18n/translations";

export function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "compact" }) {
    const { language, setLanguage, languageInfo, supportedLanguages } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size={variant === "compact" ? "icon" : "default"}
                    className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Globe className="h-4 w-4" />
                    {variant !== "compact" && (
                        <span className="text-sm">
                            {languageInfo.flag} {languageInfo.nativeName}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {supportedLanguages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code as Language)}
                        className={`flex items-center gap-3 cursor-pointer ${language === lang.code ? "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300" : ""
                            }`}
                    >
                        <span className="text-lg">{lang.flag}</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{lang.nativeName}</span>
                            <span className="text-xs text-muted-foreground">{lang.name}</span>
                        </div>
                        {language === lang.code && (
                            <span className="ml-auto text-violet-600">✓</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
