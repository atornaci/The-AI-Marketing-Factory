"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user already gave consent
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            // Show banner after a short delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie_consent", "accepted");
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("cookie_consent", "declined");
        setIsVisible(false);
        // Optionally disable GA
        if (typeof window !== "undefined") {
            (window as unknown as Record<string, unknown>)[`ga-disable-${process.env.NEXT_PUBLIC_GA_ID}`] = true;
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-500">
            <div className="max-w-3xl mx-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20 p-5">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Cookie className="w-5 h-5 text-amber-400" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground mb-1">Cookie Notice 🍪</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            We use essential cookies for authentication and Google Analytics cookies to improve your experience.
                            By clicking &quot;Accept&quot;, you consent to the use of analytics cookies. Read our{" "}
                            <Link href="/privacy" className="text-violet-400 hover:underline">
                                Privacy Policy
                            </Link>{" "}
                            for more details.
                        </p>
                    </div>

                    {/* Close */}
                    <button
                        onClick={handleDecline}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                        onClick={handleDecline}
                        className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 rounded-lg transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 rounded-lg transition-all shadow-lg shadow-violet-500/20"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
}
