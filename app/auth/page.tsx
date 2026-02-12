"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sparkles,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    Zap,
    Globe,
    Video,
    Bot,
    Share2,
} from "lucide-react";
import Link from "next/link";

/* ─── Squiggle SVG underline ─── */
const SquiggleUnderline = () => (
    <svg
        aria-hidden="true"
        viewBox="0 0 418 42"
        className="absolute -bottom-2 left-0 w-full h-[0.58em]"
        preserveAspectRatio="none"
    >
        <path
            d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6.089-12.56-5.527l-1.07.064z"
            fill="currentColor"
            className="text-violet-500"
        />
    </svg>
);

/* ─── Animation variants ─── */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

/* ─── Features for side panel ─── */
const sideFeatures = [
    {
        icon: Globe,
        title: "Proje Analizi",
        desc: "URL girin, AI analiz etsin",
    },
    {
        icon: Bot,
        title: "AI Influencer",
        desc: "Markanıza özel karakter",
    },
    {
        icon: Video,
        title: "Video Üretimi",
        desc: "Platformlara özel içerik",
    },
    {
        icon: Share2,
        title: "Otonom Dağıtım",
        desc: "Otomatik yayınlama",
    },
];

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/dashboard");
                router.refresh();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
                    },
                });
                if (error) throw error;
                setSuccess(
                    "Kayıt başarılı! E-posta kutunu kontrol et veya direkt giriş yap."
                );
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Bir hata oluştu";
            setError(
                message === "Invalid login credentials"
                    ? "E-posta veya şifre hatalı"
                    : message === "User already registered"
                        ? "Bu e-posta zaten kayıtlı"
                        : message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* ─── Left Panel: Branding & Features ─── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.1),transparent_70%)]" />
                <div className="absolute inset-0 grid-bg opacity-40" />

                {/* Animated orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-violet-500/8 rounded-full blur-[80px]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/6 w-[250px] h-[250px] bg-purple-500/8 rounded-full blur-[100px]"
                    animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Logo */}
                        <motion.div variants={itemVariants} className="mb-12">
                            <Link href="/" className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold tracking-tight">
                                    AI Marketing{" "}
                                    <span className="gradient-text">Factory</span>
                                </span>
                            </Link>
                        </motion.div>

                        {/* Title */}
                        <motion.div variants={itemVariants} className="mb-6">
                            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1]">
                                Pazarlamanızı
                                <br />
                                <span className="relative whitespace-nowrap">
                                    <span className="relative gradient-text">
                                        Otomatikleştirin
                                    </span>
                                    <SquiggleUnderline />
                                </span>
                            </h1>
                        </motion.div>

                        <motion.p
                            variants={itemVariants}
                            className="text-muted-foreground text-lg mb-12 max-w-md leading-relaxed"
                        >
                            Tek bir URL ile AI Influencer oluşturun, profesyonel videolar
                            üretin ve tüm platformlara otomatik yayınlayın.
                        </motion.p>

                        {/* Feature list */}
                        <div className="space-y-3">
                            {sideFeatures.map((f) => (
                                <motion.div
                                    key={f.title}
                                    variants={itemVariants}
                                    className="flex items-center gap-4 p-3.5 rounded-xl border border-border/50 bg-background/30 backdrop-blur-sm"
                                >
                                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                                        <f.icon className="w-4.5 h-4.5 text-violet-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">{f.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {f.desc}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ─── Right Panel: Auth Form ─── */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
                <motion.div
                    className="w-full max-w-md"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Mobile logo */}
                    <motion.div variants={itemVariants} className="lg:hidden mb-8">
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2.5"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                <Sparkles className="w-4.5 h-4.5 text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">
                                AI Marketing{" "}
                                <span className="gradient-text">Factory</span>
                            </span>
                        </Link>
                    </motion.div>

                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-background/50 text-xs mb-4">
                            <Zap className="w-3 h-3 text-violet-400" />
                            <span className="text-muted-foreground">
                                {isLogin ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold">
                            {isLogin ? "Giriş Yap" : "Kayıt Ol"}
                        </h2>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        variants={itemVariants}
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        {/* Email */}
                        <div className="relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-violet-400 transition-colors">
                                <Mail className="w-4.5 h-4.5" />
                            </div>
                            <Input
                                type="email"
                                placeholder="E-posta adresi"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-11 h-12 rounded-xl border-border/50 bg-background/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-violet-400 transition-colors">
                                <Lock className="w-4.5 h-4.5" />
                            </div>
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Şifre"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="pl-11 pr-11 h-12 rounded-xl border-border/50 bg-background/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4.5 h-4.5" />
                                ) : (
                                    <Eye className="w-4.5 h-4.5" />
                                )}
                            </button>
                        </div>

                        {/* Error/Success */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-sm text-red-400"
                            >
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-sm text-emerald-400"
                            >
                                {success}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 text-base font-semibold shadow-lg shadow-violet-500/25 transition-all"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? "Giriş Yap" : "Kayıt Ol"}
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </motion.form>

                    {/* Divider */}
                    <motion.div
                        variants={itemVariants}
                        className="my-6 flex items-center gap-3"
                    >
                        <div className="flex-1 h-px bg-border/50" />
                        <span className="text-xs text-muted-foreground">veya</span>
                        <div className="flex-1 h-px bg-border/50" />
                    </motion.div>

                    {/* Toggle */}
                    <motion.div variants={itemVariants} className="text-center">
                        <p className="text-sm text-muted-foreground">
                            {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError("");
                                    setSuccess("");
                                }}
                                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                            >
                                {isLogin ? "Kayıt ol" : "Giriş yap"}
                            </button>
                        </p>
                    </motion.div>

                    {/* Back to landing */}
                    <motion.div variants={itemVariants} className="mt-8 text-center">
                        <Link
                            href="/"
                            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                            ← Ana sayfaya dön
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
