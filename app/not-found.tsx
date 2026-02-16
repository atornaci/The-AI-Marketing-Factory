import Link from "next/link";
import { Sparkles, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
            <div className="text-center max-w-md mx-auto">
                {/* Animated 404 */}
                <div className="relative mb-8">
                    <div className="text-[120px] font-black tracking-tighter bg-gradient-to-b from-violet-400 via-purple-500 to-transparent bg-clip-text text-transparent leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-2xl shadow-violet-500/30 animate-pulse">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-2xl font-bold mb-3">Page Not Found</h1>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                    Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    Let&apos;s get you back to creating amazing AI content.
                </p>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                    <Link href="/">
                        <Button variant="outline" className="gap-2 rounded-xl">
                            <Home className="w-4 h-4" />
                            Home
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 shadow-lg shadow-violet-500/20">
                            <Sparkles className="w-4 h-4" />
                            Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Footer */}
                <div className="mt-16 flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
                    <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
                    <span>·</span>
                    <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
                    <span>·</span>
                    <Link href="/ai-disclosure" className="hover:text-muted-foreground transition-colors">AI Disclosure</Link>
                </div>
            </div>
        </div>
    );
}
