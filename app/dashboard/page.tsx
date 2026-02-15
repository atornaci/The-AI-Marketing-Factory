"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Loader2,
    LogOut,
    Zap,
    UserRound,
    Building2,
    MapPin,
    Flame,
    MessageSquareText,
    Clapperboard,
    Video,
    Download,
    Play,
    RefreshCw,
    Bot,
    ChevronDown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ─── */
interface CreatedInfluencer {
    id: string;
    name: string;
    personality?: string;
    backstory?: string;
    avatarUrl?: string;
    projectId: string;
}

interface GeneratedVideo {
    id: string;
    title?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    platform: string;
    script?: string;
}

/* ─── Animation variants ─── */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
};

/* ─── Dashboard ─── */
function DashboardContent() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState("");

    /* ─── Quick Video State ─── */
    const [quickGender, setQuickGender] = useState<"female" | "male">("female");
    const [quickScript, setQuickScript] = useState("");
    const [quickSector, setQuickSector] = useState("");
    const [quickEnvironment, setQuickEnvironment] = useState("");
    const [quickEnergy, setQuickEnergy] = useState("");
    const [isQuickCreating, setIsQuickCreating] = useState(false);
    const [quickStep, setQuickStep] = useState("");
    const [quickProgress, setQuickProgress] = useState(0);

    /* ─── Influencer Result State ─── */
    const [createdInfluencer, setCreatedInfluencer] = useState<CreatedInfluencer | null>(null);

    /* ─── Video Generation State ─── */
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [genProgress, setGenProgress] = useState(0);
    const [genStep, setGenStep] = useState("");
    const [genError, setGenError] = useState("");
    const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
    const [selectedPlatform, setSelectedPlatform] = useState<"tiktok" | "instagram" | "youtube">("tiktok");
    const [showPlatformMenu, setShowPlatformMenu] = useState(false);

    const SECTOR_OPTIONS = [
        { value: 'fitness', label: '💪 Fitness & Spor' },
        { value: 'teknoloji', label: '💻 Teknoloji' },
        { value: 'guzellik', label: '💄 Güzellik & Bakım' },
        { value: 'egitim', label: '📚 Eğitim' },
        { value: 'saglik', label: '🏥 Sağlık' },
        { value: 'eticaret', label: '🛒 E-ticaret' },
        { value: 'yemek', label: '🍽️ Yemek & Restoran' },
        { value: 'finans', label: '💰 Finans' },
        { value: 'gayrimenkul', label: '🏠 Gayrimenkul' },
        { value: 'seyahat', label: '✈️ Seyahat' },
        { value: 'moda', label: '👗 Moda' },
        { value: 'otomotiv', label: '🚗 Otomotiv' },
    ];

    const ENVIRONMENT_OPTIONS = [
        { value: 'kafe', label: '☕ Kafe' },
        { value: 'spor-salonu', label: '🏋️ Spor Salonu' },
        { value: 'park', label: '🌳 Park' },
        { value: 'ev', label: '🏠 Ev / Salon' },
        { value: 'ofis', label: '💼 Ofis' },
        { value: 'sokak', label: '🚶 Sokak' },
        { value: 'restoran', label: '🍽️ Restoran' },
        { value: 'araba', label: '🚗 Araba İçi' },
        { value: 'yatak-odasi', label: '🛏️ Yatak Odası' },
        { value: 'mutfak', label: '🍳 Mutfak' },
        { value: 'balkon', label: '🌆 Balkon' },
    ];

    const ENERGY_OPTIONS = [
        { value: 'sakin', label: '😌 Sakin' },
        { value: 'enerjik', label: '⚡ Enerjik' },
        { value: 'samimi', label: '🤗 Samimi' },
        { value: 'ciddi', label: '🎯 Ciddi' },
        { value: 'coskulu', label: '🔥 Coşkulu' },
        { value: 'motivasyonel', label: '💪 Motivasyonel' },
    ];

    const PLATFORM_CONFIG = {
        tiktok: { label: 'TikTok', icon: '🎵', color: 'from-pink-500 to-red-500' },
        instagram: { label: 'Instagram', icon: '📸', color: 'from-purple-500 to-pink-500' },
        youtube: { label: 'YouTube', icon: '▶️', color: 'from-red-500 to-red-600' },
    };

    /* ─── Auth Check ─── */
    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth");
                return;
            }
            setUserEmail(user.email || "");
        } catch (err) {
            console.error("Auth error:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase, router]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    /* ─── Sign Out ─── */
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/auth");
    };

    /* ─── Quick Video Handler — Creates Influencer Inline ─── */
    const handleQuickVideo = async () => {
        if (!quickScript.trim() || !quickSector) return;
        setIsQuickCreating(true);
        setQuickProgress(10);
        setQuickStep("Proje oluşturuluyor...");

        try {
            const sectorLabel = SECTOR_OPTIONS.find(s => s.value === quickSector)?.label?.replace(/^\S+\s/, '') || quickSector;
            const envLabel = quickEnvironment ? (ENVIRONMENT_OPTIONS.find(e => e.value === quickEnvironment)?.label?.replace(/^\S+\s/, '') || quickEnvironment) : '';
            const energyLabel = quickEnergy ? (ENERGY_OPTIONS.find(e => e.value === quickEnergy)?.label?.replace(/^\S+\s/, '') || quickEnergy) : '';

            const projectDescription = [
                `Sektör: ${sectorLabel}.`,
                envLabel ? `Ortam: ${envLabel}.` : '',
                energyLabel ? `Enerji: ${energyLabel}.` : '',
                quickScript.trim(),
            ].filter(Boolean).join(' ');

            const projectName = `${sectorLabel} — ${quickScript.trim().substring(0, 30)}`;

            // Step 1: Auto-create project
            const projRes = await fetch('/api/projects/quick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: projectName, description: projectDescription }),
            });
            if (!projRes.ok) {
                const err = await projRes.json();
                throw new Error(err.error || 'Proje oluşturulamadı');
            }
            const { project } = await projRes.json();
            setQuickProgress(30);
            setQuickStep("AI Influencer oluşturuluyor...");

            // Step 2: Create influencer
            const infRes = await fetch('/api/workflows/create-influencer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: project.id,
                    gender: quickGender,
                    sector: quickSector,
                    environment: quickEnvironment,
                    energy: quickEnergy,
                    brandName: projectName,
                    brandDescription: projectDescription,
                }),
            });
            if (!infRes.ok) {
                const err = await infRes.json();
                throw new Error(err.error || 'Influencer oluşturulamadı');
            }
            const { influencer } = await infRes.json();
            setQuickProgress(90);
            setQuickStep("Influencer hazır! ✓");

            // Save influencer to state (no redirect!)
            setCreatedInfluencer({
                id: influencer.id,
                name: influencer.name,
                personality: influencer.personality,
                backstory: influencer.backstory,
                avatarUrl: influencer.avatarUrl,
                projectId: project.id,
            });

            await new Promise((r) => setTimeout(r, 600));
            setQuickProgress(100);
        } catch (err) {
            setQuickStep(`Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
        } finally {
            setTimeout(() => {
                setIsQuickCreating(false);
                setQuickProgress(0);
                setQuickStep('');
            }, 2000);
        }
    };

    /* ─── Generate Video ─── */
    const handleGenerateVideo = async () => {
        if (!createdInfluencer) return;
        setIsGeneratingVideo(true);
        setGenProgress(0);
        setGenStep("Video üretimi başlatılıyor...");
        setGenError("");

        const steps = [
            { progress: 10, label: "Video prompt hazırlanıyor..." },
            { progress: 25, label: "AI ile prompt güçlendiriliyor..." },
            { progress: 40, label: "fal.ai'ya gönderiliyor..." },
            { progress: 55, label: "Video render ediliyor..." },
            { progress: 65, label: "Render devam ediyor..." },
            { progress: 75, label: "Neredeyse hazır..." },
            { progress: 85, label: "Son dokunuşlar..." },
            { progress: 90, label: "Video kaydediliyor..." },
        ];

        let currentStep = 0;
        const progressInterval = setInterval(() => {
            if (currentStep < steps.length) {
                setGenProgress(steps[currentStep].progress);
                setGenStep(steps[currentStep].label);
                currentStep++;
            }
        }, 15000);

        try {
            const sectorLabel = SECTOR_OPTIONS.find(s => s.value === quickSector)?.label?.replace(/^\S+\s/, '') || quickSector;
            const videoPrompt = `Create a ${selectedPlatform} marketing video for "${sectorLabel}". ${quickScript}`;

            const response = await fetch("/api/workflows/generate-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: createdInfluencer.projectId,
                    platform: selectedPlatform,
                    prompt: videoPrompt,
                    brandName: sectorLabel,
                    title: `${sectorLabel} - ${selectedPlatform} Video`,
                    influencerId: createdInfluencer.id,
                    influencerName: createdInfluencer.name,
                    influencerPersonality: createdInfluencer.personality || null,
                    influencerBackstory: createdInfluencer.backstory || null,
                    productImageUrls: [],
                    language: 'tr',
                }),
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Video üretilemedi");
            }

            const { video } = await response.json();

            setGenProgress(100);
            setGenStep("Video tamamlandı! ✓");

            setGeneratedVideos(prev => [{
                id: video.id,
                title: video.title,
                videoUrl: video.videoUrl,
                thumbnailUrl: video.thumbnailUrl,
                platform: selectedPlatform,
                script: video.script,
            }, ...prev]);

        } catch (err) {
            clearInterval(progressInterval);
            const errMsg = err instanceof Error ? err.message : "Bilinmeyen hata";
            setGenError(errMsg);
            setGenStep(`Hata: ${errMsg}`);
        } finally {
            setTimeout(() => {
                setIsGeneratingVideo(false);
                setGenProgress(0);
                setGenStep("");
            }, 2000);
        }
    };

    /* ─── Reset / New Influencer ─── */
    const handleReset = () => {
        setCreatedInfluencer(null);
        setGeneratedVideos([]);
        setQuickScript("");
        setQuickSector("");
        setQuickEnvironment("");
        setQuickEnergy("");
        setQuickGender("female");
        setGenError("");
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/25">
                        <Sparkles className="w-7 h-7 text-white animate-pulse" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Yükleniyor...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    /* ─── Main ─── */
    return (
        <div className="min-h-screen bg-background">
            {/* Subtle background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 grid-bg opacity-40" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/[0.05] rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/[0.05] rounded-full blur-[100px]" />
            </div>

            {/* ═══ Header ═══ */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/90 border-b border-border">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Left: Logo */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Sparkles className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight hidden sm:block">
                            AI Marketing <span className="gradient-text">Factory</span>
                        </span>
                    </Link>

                    {/* Right: User + Logout */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background text-xs">
                            <Zap className="w-3 h-3 text-violet-500" />
                            <span className="text-muted-foreground">AI Motor Aktif</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-border/50">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center text-xs font-semibold text-violet-500">
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-muted-foreground hidden lg:block max-w-[140px] truncate">
                                {userEmail}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSignOut}
                                className="w-8 h-8 text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Çıkış Yap"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ═══ Main Content ═══ */}
            <main className="relative max-w-5xl mx-auto px-6 py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* ─── Welcome Banner ─── */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold tracking-tight">
                                AI Video Oluşturucu 🎬
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                Influencer oluştur, script yaz, video üret — hepsi tek sayfada
                            </p>
                        </div>
                    </motion.div>

                    {/* ═══ STEP 1: Create Influencer Form ═══ */}
                    {!createdInfluencer && (
                        <motion.div variants={itemVariants} className="mb-10">
                            <div className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-500/[0.04] via-purple-500/[0.02] to-transparent shadow-sm">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                                <div className="relative p-6 lg:p-8">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                            <Clapperboard className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold tracking-tight">Influencer Oluştur</h2>
                                            <p className="text-xs text-muted-foreground">Cinsiyet seç, sektör belirle, ne söylesin yaz!</p>
                                        </div>
                                    </div>

                                    {/* Row 1: Gender + Selectors */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                                        {/* Gender Selector */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                                                <UserRound className="w-3.5 h-3.5" />
                                                Cinsiyet
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setQuickGender("female")}
                                                    disabled={isQuickCreating}
                                                    className={`flex-1 p-2 rounded-xl border text-center transition-all ${quickGender === "female"
                                                        ? "border-violet-400 bg-violet-500/10 ring-2 ring-violet-400/30 shadow-sm"
                                                        : "border-border/50 hover:border-violet-300/50 bg-background/50"
                                                        }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full mx-auto mb-1 overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200">
                                                        <Image src="/default-influencer-female.png" alt="Kadın" width={32} height={32} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-[10px] font-medium">Kadın</span>
                                                </button>
                                                <button
                                                    onClick={() => setQuickGender("male")}
                                                    disabled={isQuickCreating}
                                                    className={`flex-1 p-2 rounded-xl border text-center transition-all ${quickGender === "male"
                                                        ? "border-violet-400 bg-violet-500/10 ring-2 ring-violet-400/30 shadow-sm"
                                                        : "border-border/50 hover:border-violet-300/50 bg-background/50"
                                                        }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full mx-auto mb-1 overflow-hidden bg-gradient-to-br from-blue-200 to-indigo-200">
                                                        <Image src="/default-influencer-male.png" alt="Erkek" width={32} height={32} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-[10px] font-medium">Erkek</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sektör */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5" />
                                                Sektör <span className="text-red-400">*</span>
                                            </label>
                                            <select
                                                value={quickSector}
                                                onChange={(e) => setQuickSector(e.target.value)}
                                                disabled={isQuickCreating}
                                                className="w-full h-[68px] px-3 rounded-xl border border-border/50 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Sektör seçin...</option>
                                                {SECTOR_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Ortam */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5" />
                                                Ortam <span className="text-muted-foreground/40 text-[10px]">(opsiyonel)</span>
                                            </label>
                                            <select
                                                value={quickEnvironment}
                                                onChange={(e) => setQuickEnvironment(e.target.value)}
                                                disabled={isQuickCreating}
                                                className="w-full h-[68px] px-3 rounded-xl border border-border/50 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Otomatik</option>
                                                {ENVIRONMENT_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Enerji */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                                                <Flame className="w-3.5 h-3.5" />
                                                Enerji <span className="text-muted-foreground/40 text-[10px]">(opsiyonel)</span>
                                            </label>
                                            <select
                                                value={quickEnergy}
                                                onChange={(e) => setQuickEnergy(e.target.value)}
                                                disabled={isQuickCreating}
                                                className="w-full h-[68px] px-3 rounded-xl border border-border/50 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Otomatik</option>
                                                {ENERGY_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Row 2: Script + Generate Button */}
                                    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mt-4">
                                        {/* Script Input */}
                                        <div className="flex-1 min-w-0">
                                            <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                                                <MessageSquareText className="w-3.5 h-3.5" />
                                                Influencer ne söylesin? <span className="text-muted-foreground/50">(10s video)</span>
                                            </label>
                                            <textarea
                                                placeholder="Örn: Merhaba! Bu kafede oturup size harika bir fitness uygulamasından bahsetmek istiyorum. Spor yapmak artık çok kolay!"
                                                value={quickScript}
                                                onChange={(e) => setQuickScript(e.target.value)}
                                                disabled={isQuickCreating}
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
                                            />
                                        </div>

                                        {/* Generate Button */}
                                        <div className="shrink-0 flex items-end">
                                            <Button
                                                onClick={handleQuickVideo}
                                                disabled={!quickScript.trim() || !quickSector || isQuickCreating}
                                                className="h-[72px] px-8 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 shadow-lg shadow-violet-500/25 text-sm font-semibold flex items-center gap-2 w-full lg:w-auto"
                                            >
                                                {isQuickCreating ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span>Oluşturuluyor...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-5 h-5" />
                                                        <span>Oluştur</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <AnimatePresence>
                                        {isQuickCreating && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-5 space-y-2"
                                            >
                                                <Progress value={quickProgress} className="h-1.5" />
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Loader2 className="w-3 h-3 animate-spin text-violet-500" />
                                                    {quickStep}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ STEP 2: Influencer Card + Video Generation ═══ */}
                    {createdInfluencer && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            {/* Influencer Card */}
                            <div className="relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-500/[0.04] via-teal-500/[0.02] to-transparent shadow-sm">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                                <div className="relative p-6 lg:p-8">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        {/* Avatar */}
                                        <div className="shrink-0">
                                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-emerald-300/50 shadow-lg mx-auto sm:mx-0">
                                                {createdInfluencer.avatarUrl ? (
                                                    <Image
                                                        src={createdInfluencer.avatarUrl}
                                                        alt={createdInfluencer.name}
                                                        width={144}
                                                        height={144}
                                                        className="w-full h-full object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                                        <Bot className="w-12 h-12 text-emerald-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200/50">
                                                            ✓ Influencer Hazır
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-bold tracking-tight">{createdInfluencer.name}</h3>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleReset}
                                                    className="text-xs text-muted-foreground hover:text-violet-600 rounded-lg"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                                    Yeni Oluştur
                                                </Button>
                                            </div>

                                            {createdInfluencer.personality && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    <span className="font-medium text-foreground">Kişilik:</span> {createdInfluencer.personality}
                                                </p>
                                            )}
                                            {createdInfluencer.backstory && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    <span className="font-medium text-foreground">Hikaye:</span> {createdInfluencer.backstory}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─── Video Generation Section ─── */}
                            <div className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-500/[0.04] via-purple-500/[0.02] to-transparent shadow-sm">
                                <div className="relative p-6 lg:p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                                <Video className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold tracking-tight">Video Üret</h3>
                                                <p className="text-xs text-muted-foreground">Platform seç ve video oluştur</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Platform + Generate */}
                                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                                        {/* Platform Selector */}
                                        <div className="relative">
                                            <label className="text-xs font-medium text-muted-foreground mb-2 block">Platform</label>
                                            <button
                                                onClick={() => setShowPlatformMenu(!showPlatformMenu)}
                                                className="flex items-center gap-2 h-11 px-4 rounded-xl border border-border/50 bg-background/50 text-sm hover:border-violet-300 transition-all w-full sm:w-auto min-w-[160px]"
                                            >
                                                <span>{PLATFORM_CONFIG[selectedPlatform].icon}</span>
                                                <span className="font-medium">{PLATFORM_CONFIG[selectedPlatform].label}</span>
                                                <ChevronDown className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                                            </button>
                                            {showPlatformMenu && (
                                                <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-xl shadow-lg z-10 py-1">
                                                    {(Object.keys(PLATFORM_CONFIG) as Array<keyof typeof PLATFORM_CONFIG>).map(p => (
                                                        <button
                                                            key={p}
                                                            onClick={() => { setSelectedPlatform(p); setShowPlatformMenu(false); }}
                                                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-violet-50 transition-colors ${selectedPlatform === p ? 'bg-violet-50 text-violet-600 font-medium' : ''}`}
                                                        >
                                                            <span>{PLATFORM_CONFIG[p].icon}</span>
                                                            {PLATFORM_CONFIG[p].label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Generate Button */}
                                        <Button
                                            onClick={handleGenerateVideo}
                                            disabled={isGeneratingVideo}
                                            className={`h-11 px-6 rounded-xl bg-gradient-to-r ${PLATFORM_CONFIG[selectedPlatform].color} hover:opacity-90 border-0 shadow-lg text-sm font-semibold flex items-center gap-2`}
                                        >
                                            {isGeneratingVideo ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Üretiliyor...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4" />
                                                    Video Üret
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Video Generation Progress */}
                                    <AnimatePresence>
                                        {isGeneratingVideo && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-5 space-y-2"
                                            >
                                                <Progress value={genProgress} className="h-1.5" />
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Loader2 className="w-3 h-3 animate-spin text-violet-500" />
                                                    {genStep}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground/50">
                                                    Video üretimi 2-5 dakika sürebilir
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Error */}
                                    {genError && !isGeneratingVideo && (
                                        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200/50 text-sm text-red-600">
                                            ⚠️ {genError}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ─── Generated Videos ─── */}
                            {generatedVideos.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                                        <Video className="w-5 h-5 text-violet-500" />
                                        Üretilen Videolar ({generatedVideos.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {generatedVideos.map((video) => (
                                            <div
                                                key={video.id}
                                                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:border-violet-300/50 hover:shadow-md transition-all"
                                            >
                                                {/* Video Player */}
                                                {video.videoUrl ? (
                                                    <div className="aspect-[9/16] max-h-[400px] bg-black relative">
                                                        <video
                                                            src={video.videoUrl}
                                                            controls
                                                            className="w-full h-full object-contain"
                                                            poster={video.thumbnailUrl || undefined}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="aspect-video bg-muted/50 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-2" />
                                                            <p className="text-xs text-muted-foreground">Video hazırlanıyor...</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Video Info */}
                                                <div className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{PLATFORM_CONFIG[video.platform as keyof typeof PLATFORM_CONFIG]?.icon || '🎬'}</span>
                                                            <div>
                                                                <p className="text-sm font-medium">{video.title || 'Video'}</p>
                                                                <p className="text-xs text-muted-foreground capitalize">{video.platform}</p>
                                                            </div>
                                                        </div>
                                                        {video.videoUrl && (
                                                            <a
                                                                href={video.videoUrl}
                                                                download
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 text-xs font-medium hover:bg-violet-500/20 transition-colors"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                İndir
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

/* ─── Page Export ─── */
export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center mx-auto">
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Yükleniyor...
                        </p>
                    </div>
                </div>
            }
        >
            <DashboardContent />
        </Suspense>
    );
}
