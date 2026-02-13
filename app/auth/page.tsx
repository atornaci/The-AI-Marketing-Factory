"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
} from "framer-motion";
import {
    Sparkles,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Globe,
    Video,
    Bot,
    Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        transition: { duration: 0.5, ease: "easeOut" as const },
    },
};

/* ─── Features for side panel ─── */
const sideFeatures = [
    { icon: Globe, title: "Proje Analizi", desc: "URL girin, AI analiz etsin" },
    { icon: Bot, title: "AI Influencer", desc: "Markanıza özel karakter" },
    { icon: Video, title: "Video Üretimi", desc: "Platformlara özel içerik" },
    { icon: Share2, title: "Otonom Dağıtım", desc: "Otomatik yayınlama" },
];

/* ─── Dark Input ─── */
function LightInput({
    className,
    ...props
}: React.ComponentProps<"input">) {
    return (
        <input
            className={cn(
                "placeholder:text-muted-foreground/50 flex h-10 w-full min-w-0 rounded-lg border bg-muted/50 border-border/60 px-3 py-1 text-sm text-foreground shadow-xs transition-all duration-300 outline-none",
                "focus:border-violet-300 focus:bg-background focus:ring-1 focus:ring-violet-200",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}

/* ═══════════════════════════════════════════════
   AUTH PAGE
   ═══════════════════════════════════════════════ */
export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    // 3D card effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
    const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    /* ─── Supabase Auth ─── */
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
            {/* ═══════════════════════════════════════
                LEFT PANEL — Branding & Features
               ═══════════════════════════════════════ */}
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

            {/* ═══════════════════════════════════════
                RIGHT PANEL — Glassmorphism Login Card
               ═══════════════════════════════════════ */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center px-6 py-12">
                {/* Subtle background accent */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.06),transparent_70%)]" />

                {/* Mobile logo */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:hidden absolute top-6 left-6 z-20"
                >
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-base font-bold tracking-tight">
                            AI Marketing <span className="gradient-text">Factory</span>
                        </span>
                    </Link>
                </motion.div>

                {/* ─── 3D Card ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-sm relative z-10"
                    style={{ perspective: 1500 }}
                >
                    <motion.div
                        className="relative"
                        style={{ rotateX, rotateY }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        whileHover={{ z: 10 }}
                    >
                        <div className="relative group">
                            {/* Card glow */}
                            <motion.div
                                className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
                                animate={{
                                    boxShadow: [
                                        "0 0 10px 2px rgba(124,58,237,0.05)",
                                        "0 0 15px 5px rgba(124,58,237,0.1)",
                                        "0 0 10px 2px rgba(124,58,237,0.05)",
                                    ],
                                    opacity: [0.2, 0.4, 0.2],
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
                            />

                            {/* ─── Traveling light beams ─── */}
                            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                                <motion.div
                                    className="absolute top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-50"
                                    initial={{ filter: "blur(1px)" }}
                                    animate={{ left: ["-50%", "100%"], opacity: [0.2, 0.5, 0.2] }}
                                    transition={{ left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }, opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" } }}
                                />
                                <motion.div
                                    className="absolute top-0 right-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-violet-400 to-transparent opacity-50"
                                    initial={{ filter: "blur(1px)" }}
                                    animate={{ top: ["-50%", "100%"], opacity: [0.2, 0.5, 0.2] }}
                                    transition={{ top: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.6 }, opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 0.6 } }}
                                />
                                <motion.div
                                    className="absolute bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-50"
                                    initial={{ filter: "blur(1px)" }}
                                    animate={{ right: ["-50%", "100%"], opacity: [0.2, 0.5, 0.2] }}
                                    transition={{ right: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 }, opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.2 } }}
                                />
                                <motion.div
                                    className="absolute bottom-0 left-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-violet-400 to-transparent opacity-50"
                                    initial={{ filter: "blur(1px)" }}
                                    animate={{ bottom: ["-50%", "100%"], opacity: [0.2, 0.5, 0.2] }}
                                    transition={{ bottom: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.8 }, opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.8 } }}
                                />
                            </div>

                            {/* Card border glow */}
                            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-violet-500/[0.05] via-violet-500/[0.1] to-violet-500/[0.05] opacity-0 group-hover:opacity-70 transition-opacity duration-500" />

                            {/* ═══ Glass Card ═══ */}
                            <div className="relative bg-background backdrop-blur-xl rounded-2xl p-6 border border-border/60 shadow-xl overflow-hidden">
                                {/* Inner pattern */}
                                <div
                                    className="absolute inset-0 opacity-[0.02]"
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, rgba(124,58,237,0.3) 0.5px, transparent 0.5px), linear-gradient(45deg, rgba(124,58,237,0.3) 0.5px, transparent 0.5px)`,
                                        backgroundSize: "30px 30px",
                                    }}
                                />

                                {/* Logo & Header */}
                                <div className="text-center space-y-1 mb-5">
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", duration: 0.8 }}
                                        className="mx-auto w-10 h-10 rounded-full border border-violet-200 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-violet-600 to-purple-500 shadow-lg shadow-violet-500/25"
                                    >
                                        <Sparkles className="w-5 h-5 text-white" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                                    </motion.div>

                                    <motion.h1
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-xl font-bold text-foreground"
                                    >
                                        {isLogin ? "Tekrar Hoş Geldin" : "Hesap Oluştur"}
                                    </motion.h1>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-muted-foreground text-xs"
                                    >
                                        AI Marketing Factory&apos;e{" "}
                                        {isLogin ? "giriş yap" : "kayıt ol"}
                                    </motion.p>
                                </div>

                                {/* ─── Form ─── */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <motion.div className="space-y-3">
                                        {/* Email */}
                                        <motion.div
                                            className={`relative ${focusedInput === "email" ? "z-10" : ""}`}
                                            whileHover={{ scale: 1.01 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        >
                                            <div className="relative flex items-center overflow-hidden rounded-lg">
                                                <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "email" ? "text-violet-500" : "text-muted-foreground"}`} />
                                                <LightInput
                                                    type="email"
                                                    placeholder="E-posta adresi"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    onFocus={() => setFocusedInput("email")}
                                                    onBlur={() => setFocusedInput(null)}
                                                    required
                                                    className="pl-10 pr-3"
                                                />
                                                {focusedInput === "email" && (
                                                    <motion.div
                                                        layoutId="input-highlight"
                                                        className="absolute inset-0 bg-white/5 -z-10"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    />
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Password */}
                                        <motion.div
                                            className={`relative ${focusedInput === "password" ? "z-10" : ""}`}
                                            whileHover={{ scale: 1.01 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        >
                                            <div className="relative flex items-center overflow-hidden rounded-lg">
                                                <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === "password" ? "text-violet-500" : "text-muted-foreground"}`} />
                                                <LightInput
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Şifre"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    onFocus={() => setFocusedInput("password")}
                                                    onBlur={() => setFocusedInput(null)}
                                                    required
                                                    minLength={6}
                                                    className="pl-10 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 cursor-pointer"
                                                >
                                                    {showPassword ? (
                                                        <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors duration-300" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors duration-300" />
                                                    )}
                                                </button>
                                                {focusedInput === "password" && (
                                                    <motion.div
                                                        layoutId="input-highlight"
                                                        className="absolute inset-0 bg-violet-50/50 -z-10"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    </motion.div>

                                    {/* Error / Success */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600"
                                            >
                                                {error}
                                            </motion.div>
                                        )}
                                        {success && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-600"
                                            >
                                                {success}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        className="w-full relative group/button mt-5"
                                    >
                                        <div className="absolute inset-0 bg-violet-500/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />
                                        <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-500 text-white font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40">
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -z-10"
                                                animate={{ x: ["-100%", "100%"] }}
                                                transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                                                style={{ opacity: loading ? 1 : 0, transition: "opacity 0.3s ease" }}
                                            />
                                            <AnimatePresence mode="wait">
                                                {loading ? (
                                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                        <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1 text-sm font-medium">
                                                        {isLogin ? "Giriş Yap" : "Kayıt Ol"}
                                                        <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.button>

                                    {/* Divider */}
                                    <div className="relative mt-2 mb-5 flex items-center">
                                        <div className="flex-grow border-t border-border" />
                                        <motion.span
                                            className="mx-3 text-xs text-muted-foreground"
                                            initial={{ opacity: 0.7 }}
                                            animate={{ opacity: [0.7, 0.9, 0.7] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            veya
                                        </motion.span>
                                        <div className="flex-grow border-t border-border" />
                                    </div>

                                    {/* Google */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        className="w-full relative group/google"
                                    >
                                        <div className="absolute inset-0 bg-muted/30 rounded-lg blur opacity-0 group-hover/google:opacity-70 transition-opacity duration-300" />
                                        <div className="relative overflow-hidden bg-background text-foreground font-medium h-10 rounded-lg border border-border hover:border-border/80 hover:bg-muted/50 transition-all duration-300 flex items-center justify-center gap-2">
                                            <img
                                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                                alt="Google"
                                                className="w-4 h-4"
                                            />
                                            <span className="text-muted-foreground group-hover/google:text-foreground transition-colors text-xs">
                                                Google ile giriş yap
                                            </span>
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent"
                                                initial={{ x: "-100%" }}
                                                whileHover={{ x: "100%" }}
                                                transition={{ duration: 1, ease: "easeInOut" }}
                                            />
                                        </div>
                                    </motion.button>

                                    {/* Toggle */}
                                    <motion.p
                                        className="text-center text-xs text-muted-foreground mt-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsLogin(!isLogin);
                                                setError("");
                                                setSuccess("");
                                            }}
                                            className="relative inline-block group/toggle"
                                        >
                                            <span className="relative z-10 text-violet-600 group-hover/toggle:text-violet-500 transition-colors duration-300 font-medium">
                                                {isLogin ? "Kayıt ol" : "Giriş yap"}
                                            </span>
                                            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-violet-500 group-hover/toggle:w-full transition-all duration-300" />
                                        </button>
                                    </motion.p>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
