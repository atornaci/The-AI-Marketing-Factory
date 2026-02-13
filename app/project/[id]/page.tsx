"use client";

import { useState, useEffect, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
    Sparkles,
    Globe,
    Video,
    Bot,
    ArrowLeft,
    ExternalLink,
    Play,
    Download,
    Share2,
    RefreshCw,
    Mic,
    FileText,
    Image as ImageIcon,
    Loader2,
    CheckCircle2,
    Wand2,
    Monitor,
    Users,
    Target,
    Shield,
    Zap,
    AlertTriangle,
    Trash2,
    Copy,
    Trophy,
    Megaphone,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ─── */
interface ProjectData {
    id: string;
    name: string;
    url: string;
    description?: string;
    analysis_status?: string;
    value_proposition?: string;
    target_audience?: {
        demographics?: string[];
        interests?: string[];
        painPoints?: string[];
    };
    competitors?: string[];
    marketing_constitution?: {
        brandVoice?: string;
        contentPillars?: string[];
        messagingFramework?: {
            hook?: string;
            problem?: string;
            solution?: string;
            cta?: string;
        };
        visualGuidelines?: {
            colorPalette?: string[];
            mood?: string;
            style?: string;
        };
    };
    competitor_analysis?: {
        competitors?: {
            name: string;
            url?: string;
            strengths: string[];
            weaknesses: string[];
            opportunities?: string[];
            threats?: string[];
            ourAdvantage: string;
            estimatedPosition?: string;
        }[];
        marketPosition?: string;
        marketOpportunities?: string[];
        attackStrategies?: string[];
        generatedAt?: string;
    };
    ad_copies?: {
        variations?: {
            id: number;
            approach: string;
            headline: string;
            body: string;
            cta: string;
            platform: string;
        }[];
        generatedAt?: string;
    };
}

interface InfluencerData {
    id: string;
    name: string;
    personality?: string;
    backstory?: string;
    voice_id?: string;
    status: string;
    gender?: string;
    avatar_url?: string;
    visual_profile?: Record<string, unknown>;
}

interface VideoData {
    id: string;
    title?: string;
    platform: string;
    status: string;
    duration_seconds?: number;
    video_url?: string;
    thumbnail_url?: string;
    script?: string;
    metadata?: {
        hashtags?: string[];
        hook?: string;
        cta?: string;
        error?: string;
    };
    storyboard?: {
        hookVariations?: { id: number; text: string; style: string; estimatedImpact: string }[];
        selectedHook?: number;
        scenes?: { sceneNumber: number; startSecond: number; endSecond: number; narration: string; visualDescription: string; screenContent?: string; cameraDirection: string; emotion: string }[];
        totalDuration?: number;
        platform?: string;
        problemSolutionMap?: { problem: string; feature: string; videoMoment: string }[];
    };
    created_at: string;
}

interface AssetData {
    id: string;
    asset_type: string;
    file_path: string;
    original_filename?: string;
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

export default function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const supabase = createClient();

    const [activeTab, setActiveTab] = useState("overview");
    const [project, setProject] = useState<ProjectData | null>(null);
    const [influencer, setInfluencer] = useState<InfluencerData | null>(null);
    const [videos, setVideos] = useState<VideoData[]>([]);
    const [assets, setAssets] = useState<AssetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Video generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingPlatform, setGeneratingPlatform] = useState("");
    const [genProgress, setGenProgress] = useState(0);
    const [genStep, setGenStep] = useState("");
    const [genError, setGenError] = useState("");

    // Influencer creation state
    const [isCreatingInfluencer, setIsCreatingInfluencer] = useState(false);
    const [influencerProgress, setInfluencerProgress] = useState(0);
    const [influencerStep, setInfluencerStep] = useState("");
    const [influencerError, setInfluencerError] = useState("");
    const [selectedGender, setSelectedGender] = useState<"male" | "female">("female");
    const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);

    // Competitor analysis state
    const [isAnalyzingCompetitors, setIsAnalyzingCompetitors] = useState(false);
    // Ad copy generation state
    const [isGeneratingAdCopy, setIsGeneratingAdCopy] = useState(false);
    const [copiedAdId, setCopiedAdId] = useState<number | null>(null);

    /* ─── Fetch project data ─── */
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            // Get project
            const { data: projectData, error: projectErr } = await supabase
                .from("projects")
                .select("*")
                .eq("id", id)
                .single();

            if (projectErr || !projectData) {
                setError("Proje bulunamadı");
                return;
            }
            setProject(projectData);

            // Get influencer
            const { data: influencerData } = await supabase
                .from("ai_influencers")
                .select("*")
                .eq("project_id", id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            setInfluencer(influencerData);

            // Get videos
            const { data: videosData } = await supabase
                .from("videos")
                .select("*")
                .eq("project_id", id)
                .order("created_at", { ascending: false });

            setVideos(videosData || []);

            // Get assets
            const { data: assetsData } = await supabase
                .from("assets")
                .select("*")
                .eq("project_id", id);

            setAssets(assetsData || []);
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Veri yüklenirken hata oluştu");
        } finally {
            setLoading(false);
        }
    }, [id, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ─── Create Influencer ─── */
    const handleCreateInfluencer = async () => {
        setIsCreatingInfluencer(true);
        setInfluencerProgress(0);
        setInfluencerStep("AI Influencer oluşturuluyor...");
        setInfluencerError("");

        const steps = [
            { progress: 15, label: "Proje analizi yapılıyor..." },
            { progress: 30, label: "Kişilik profili oluşturuluyor..." },
            { progress: 50, label: "Görsel profil tasarlanıyor..." },
            { progress: 70, label: "ElevenLabs ses profili klonlanıyor..." },
            { progress: 90, label: "Veritabanına kaydediliyor..." },
        ];

        let currentStep = 0;
        const progressInterval = setInterval(() => {
            if (currentStep < steps.length) {
                setInfluencerProgress(steps[currentStep].progress);
                setInfluencerStep(steps[currentStep].label);
                currentStep++;
            }
        }, 3000);

        try {
            const response = await fetch("/api/workflows/create-influencer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId: id, gender: selectedGender }),
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Influencer oluşturulamadı");
            }

            setInfluencerProgress(100);
            setInfluencerStep("AI Influencer hazır! ✓");
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Refresh data to show new influencer
            await fetchData();
        } catch (err) {
            clearInterval(progressInterval);
            const errMsg =
                err instanceof Error ? err.message : "Bilinmeyen hata oluştu";
            setInfluencerError(errMsg);
            setInfluencerStep(`Hata: ${errMsg}`);
        } finally {
            setTimeout(() => {
                setIsCreatingInfluencer(false);
                setInfluencerProgress(0);
                setInfluencerStep("");
            }, 2000);
        }
    };

    /* ─── Generate Video ─── */
    const handleGenerateVideo = async (
        platform: "instagram" | "tiktok" | "linkedin"
    ) => {
        setIsGenerating(true);
        setGeneratingPlatform(platform);
        setGenProgress(0);
        setGenStep("Video üretimi başlatılıyor...");
        setGenError("");

        // Progress animation while API works
        const steps = [
            { progress: 15, label: "Senaryo yazılıyor..." },
            { progress: 35, label: "AI ile içerik oluşturuluyor..." },
            { progress: 55, label: "Ses üretiliyor..." },
            { progress: 70, label: "AI Influencer render ediliyor..." },
            { progress: 85, label: "Ekran görüntüleri ekleniyor..." },
        ];

        let currentStep = 0;
        const progressInterval = setInterval(() => {
            if (currentStep < steps.length) {
                setGenProgress(steps[currentStep].progress);
                setGenStep(steps[currentStep].label);
                currentStep++;
            }
        }, 4000);

        try {
            const response = await fetch("/api/workflows/generate-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId: id, platform }),
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Video üretilemedi");
            }

            setGenProgress(100);
            setGenStep("Video tamamlandı! ✓");
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Refresh data to show new video
            await fetchData();
        } catch (err) {
            clearInterval(progressInterval);
            const errMsg =
                err instanceof Error ? err.message : "Bilinmeyen hata oluştu";
            setGenError(errMsg);
            setGenStep(`Hata: ${errMsg}`);
        } finally {
            setTimeout(() => {
                setIsGenerating(false);
                setGeneratingPlatform("");
                setGenProgress(0);
                setGenStep("");
            }, 2000);
        }
    };

    /* ─── Helpers ─── */
    const getPlatformColor = (platform: string) => {
        switch (platform) {
            case "instagram":
                return "from-pink-500 to-rose-500";
            case "tiktok":
                return "from-cyan-500 to-blue-500";
            case "linkedin":
                return "from-blue-600 to-blue-500";
            default:
                return "from-gray-500 to-gray-400";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ready":
                return {
                    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
                    text: "Hazır",
                };
            case "rendering":
            case "scripting":
            case "voiceover":
                return {
                    color: "bg-violet-50 text-violet-600 border-violet-200",
                    text: "İşleniyor",
                };
            case "draft":
                return {
                    color: "bg-amber-50 text-amber-600 border-amber-200",
                    text: "Taslak",
                };
            case "failed":
                return {
                    color: "bg-red-50 text-red-600 border-red-200",
                    text: "Hata",
                };
            default:
                return { color: "", text: status };
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Az önce";
        if (mins < 60) return `${mins} dk önce`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} saat önce`;
        const days = Math.floor(hours / 24);
        return `${days} gün önce`;
    };

    const constitution = project?.marketing_constitution;
    const targetAudience = project?.target_audience;
    const screenshots = assets.filter((a) => a.asset_type === "screenshot");

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-3"
                >
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
                    <p className="text-sm text-muted-foreground">Proje yükleniyor...</p>
                </motion.div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                    <p className="text-muted-foreground">{error || "Proje bulunamadı"}</p>
                    <Link href="/dashboard">
                        <Button variant="outline" className="rounded-xl">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Dashboard&apos;a Dön
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    /* ─── Main ─── */
    return (
        <div className="min-h-screen bg-background">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 grid-bg opacity-30" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/[0.03] rounded-full blur-[120px]" />
            </div>

            {/* ═══ Header ═══ */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl w-9 h-9"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center text-lg">
                                🌐
                            </div>
                            <div>
                                <h1 className="text-base font-bold leading-tight">
                                    {project.name}
                                </h1>
                                <a
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-violet-500 transition-colors flex items-center gap-1"
                                >
                                    {project.url}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-border/50 text-xs h-9"
                            onClick={async () => {
                                try {
                                    const url = project.url.startsWith("http")
                                        ? project.url
                                        : `https://${project.url}`;
                                    const response = await fetch("/api/workflows/onboard", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ url }),
                                    });
                                    if (response.ok) await fetchData();
                                } catch (err) {
                                    console.error("Re-analyze error:", err);
                                }
                            }}
                        >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Yeniden Analiz
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                setActiveTab("influencer");
                                // Scroll to video gen section
                                setTimeout(() => {
                                    document
                                        .getElementById("quick-video-gen")
                                        ?.scrollIntoView({ behavior: "smooth" });
                                }, 200);
                            }}
                            className="rounded-xl h-9 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 shadow-lg shadow-violet-500/20 text-xs font-medium"
                        >
                            <Video className="w-3.5 h-3.5 mr-1.5" />
                            Video Üret
                        </Button>
                    </div>
                </div>
            </header>

            {/* ═══ Main ═══ */}
            <main className="relative max-w-7xl mx-auto px-6 py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="space-y-6"
                    >
                        <motion.div variants={itemVariants}>
                            <TabsList className="bg-muted/30 border border-border/50 p-1 rounded-xl">
                                <TabsTrigger
                                    value="overview"
                                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                >
                                    <Monitor className="w-4 h-4 mr-1.5" />
                                    Genel Bakış
                                </TabsTrigger>
                                <TabsTrigger
                                    value="influencer"
                                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                >
                                    <Bot className="w-4 h-4 mr-1.5" />
                                    AI Influencer
                                </TabsTrigger>
                                <TabsTrigger
                                    value="videos"
                                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                >
                                    <Video className="w-4 h-4 mr-1.5" />
                                    Videolar
                                    {videos.length > 0 && (
                                        <span className="ml-1.5 text-[10px] bg-violet-500/10 text-violet-600 px-1.5 py-0.5 rounded-full">
                                            {videos.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="assets"
                                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                >
                                    <ImageIcon className="w-4 h-4 mr-1.5" />
                                    Görseller
                                </TabsTrigger>
                            </TabsList>
                        </motion.div>

                        {/* ═══ OVERVIEW TAB ═══ */}
                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Value Proposition */}
                                <motion.div variants={itemVariants} className="lg:col-span-2">
                                    <div className="p-6 rounded-2xl border border-border/50 bg-background/50 h-full">
                                        <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                                            <Target className="w-4 h-4 text-violet-500" />
                                            Değer Önerisi
                                        </div>
                                        <p className="text-lg font-semibold leading-relaxed mb-3">
                                            {project.value_proposition || "Henüz analiz yapılmadı"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {project.description || project.url}
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Brand Voice */}
                                <motion.div variants={itemVariants}>
                                    <div className="p-6 rounded-2xl border border-border/50 bg-background/50 h-full">
                                        <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                                            <Shield className="w-4 h-4 text-violet-500" />
                                            Marka Sesi
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                            {constitution?.brandVoice || "Henüz tanımlanmadı"}
                                        </p>
                                        {constitution?.visualGuidelines?.colorPalette && (
                                            <div className="flex gap-1.5">
                                                {constitution.visualGuidelines.colorPalette.map(
                                                    (color) => (
                                                        <div
                                                            key={color}
                                                            className="w-6 h-6 rounded-full border border-border/50"
                                                            style={{ background: color }}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Target Audience */}
                                <motion.div variants={itemVariants}>
                                    <div className="p-6 rounded-2xl border border-border/50 bg-background/50">
                                        <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                                            <Users className="w-4 h-4 text-violet-500" />
                                            Hedef Kitle
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(targetAudience?.demographics || []).map((demo) => (
                                                <Badge
                                                    key={demo}
                                                    variant="outline"
                                                    className="rounded-lg text-xs border-border/50"
                                                >
                                                    {demo}
                                                </Badge>
                                            ))}
                                            {(!targetAudience?.demographics ||
                                                targetAudience.demographics.length === 0) && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Henüz tanımlanmadı
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Pain Points */}
                                <motion.div variants={itemVariants}>
                                    <div className="p-6 rounded-2xl border border-border/50 bg-background/50">
                                        <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                                            <Zap className="w-4 h-4 text-violet-500" />
                                            Sorun Noktaları
                                        </div>
                                        <ul className="space-y-2">
                                            {(targetAudience?.painPoints || []).map((pain) => (
                                                <li
                                                    key={pain}
                                                    className="text-sm text-muted-foreground flex items-start gap-2"
                                                >
                                                    <span className="text-rose-400 mt-0.5">•</span>
                                                    {pain}
                                                </li>
                                            ))}
                                            {(!targetAudience?.painPoints ||
                                                targetAudience.painPoints.length === 0) && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Henüz tanımlanmadı
                                                    </p>
                                                )}
                                        </ul>
                                    </div>
                                </motion.div>

                                {/* Content Pillars */}
                                <motion.div variants={itemVariants}>
                                    <div className="p-6 rounded-2xl border border-border/50 bg-background/50">
                                        <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                                            <FileText className="w-4 h-4 text-violet-500" />
                                            İçerik Sütunları
                                        </div>
                                        <ul className="space-y-2">
                                            {(constitution?.contentPillars || []).map(
                                                (pillar, i) => (
                                                    <li
                                                        key={pillar}
                                                        className="text-sm flex items-center gap-2"
                                                    >
                                                        <span className="text-violet-500 font-bold text-xs">
                                                            {String(i + 1).padStart(2, "0")}
                                                        </span>
                                                        {pillar}
                                                    </li>
                                                )
                                            )}
                                            {(!constitution?.contentPillars ||
                                                constitution.contentPillars.length === 0) && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Henüz tanımlanmadı
                                                    </p>
                                                )}
                                        </ul>
                                    </div>
                                </motion.div>

                                {/* Competitor Analysis */}
                                <motion.div variants={itemVariants} className="lg:col-span-3">
                                    <div className="p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <Trophy className="w-4 h-4 text-amber-500" />
                                                Rakip Analizi
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={isAnalyzingCompetitors}
                                                onClick={async () => {
                                                    setIsAnalyzingCompetitors(true);
                                                    try {
                                                        const res = await fetch('/api/workflows/competitor-analysis', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ projectId: project.id }),
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            setProject(prev => prev ? { ...prev, competitor_analysis: data.data } : prev);
                                                        }
                                                    } catch (e) {
                                                        console.error('Competitor analysis failed:', e);
                                                    } finally {
                                                        setIsAnalyzingCompetitors(false);
                                                    }
                                                }}
                                                className="rounded-lg text-xs"
                                            >
                                                {isAnalyzingCompetitors ? (
                                                    <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Analiz Ediliyor...</>
                                                ) : (
                                                    <><RefreshCw className="w-3 h-3 mr-1.5" /> {project.competitor_analysis ? 'Yeniden Analiz Et' : 'Rakipleri Analiz Et'}</>
                                                )}
                                            </Button>
                                        </div>

                                        {project.competitor_analysis?.competitors && project.competitor_analysis.competitors.length > 0 ? (
                                            <>
                                                {/* Market Position Summary */}
                                                {project.competitor_analysis.marketPosition && (
                                                    <div className="p-4 rounded-xl bg-background/80 border border-border/30 mb-4">
                                                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">📍 Pazar Konumumuz</p>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {project.competitor_analysis.marketPosition}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Competitor Cards */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {project.competitor_analysis.competitors.map((comp, i) => (
                                                        <div key={i} className="p-4 rounded-xl bg-background/60 border border-border/30 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="font-semibold text-sm flex items-center gap-2">
                                                                    <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-600">
                                                                        {i + 1}
                                                                    </span>
                                                                    {comp.name}
                                                                </div>
                                                                {comp.estimatedPosition && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium">
                                                                        {comp.estimatedPosition}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">💪 Güçlü Yönleri</p>
                                                                <ul className="space-y-0.5">
                                                                    {comp.strengths.map((s, si) => (
                                                                        <li key={si} className="text-xs text-muted-foreground flex items-start gap-1">
                                                                            <span className="text-green-400 mt-0.5">+</span> {s}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">⚠️ Zayıf Noktaları</p>
                                                                <ul className="space-y-0.5">
                                                                    {comp.weaknesses.map((w, wi) => (
                                                                        <li key={wi} className="text-xs text-muted-foreground flex items-start gap-1">
                                                                            <span className="text-rose-400 mt-0.5">−</span> {w}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            {comp.opportunities && comp.opportunities.length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">🔍 Fırsatlar</p>
                                                                    <ul className="space-y-0.5">
                                                                        {comp.opportunities.map((o, oi) => (
                                                                            <li key={oi} className="text-xs text-muted-foreground flex items-start gap-1">
                                                                                <span className="text-blue-400 mt-0.5">◆</span> {o}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {comp.threats && comp.threats.length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">⚡ Tehditler</p>
                                                                    <ul className="space-y-0.5">
                                                                        {comp.threats.map((t, ti) => (
                                                                            <li key={ti} className="text-xs text-muted-foreground flex items-start gap-1">
                                                                                <span className="text-orange-400 mt-0.5">!</span> {t}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            <div className="pt-2 border-t border-border/30">
                                                                <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">🎯 Bizim Avantajımız</p>
                                                                <p className="text-xs text-muted-foreground">{comp.ourAdvantage}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Market Opportunities */}
                                                {project.competitor_analysis.marketOpportunities && project.competitor_analysis.marketOpportunities.length > 0 && (
                                                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">🚀 Pazar Fırsatları</p>
                                                        <ul className="space-y-1.5">
                                                            {project.competitor_analysis.marketOpportunities.map((opp, oi) => (
                                                                <li key={oi} className="text-xs text-muted-foreground flex items-start gap-2">
                                                                    <span className="text-blue-500 font-bold mt-0.5">{oi + 1}.</span>
                                                                    <span>{opp}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Attack Strategies */}
                                                {project.competitor_analysis.attackStrategies && project.competitor_analysis.attackStrategies.length > 0 && (
                                                    <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                                                        <p className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-2">⚔️ Saldırı Stratejileri</p>
                                                        <ul className="space-y-1.5">
                                                            {project.competitor_analysis.attackStrategies.map((strat, si) => (
                                                                <li key={si} className="text-xs text-muted-foreground flex items-start gap-2">
                                                                    <span className="text-violet-500 font-bold mt-0.5">→</span>
                                                                    <span>{strat}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                {isAnalyzingCompetitors ? 'Rakipler analiz ediliyor, lütfen bekleyin...' : 'Henüz rakip analizi yapılmadı. "Rakipleri Analiz Et" butonuna tıklayın.'}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </TabsContent>

                        {/* ═══ INFLUENCER TAB ═══ */}
                        <TabsContent value="influencer" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Influencer Profile */}
                                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                    {influencer ? (
                                        <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden">
                                            <div className="aspect-square bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center relative overflow-hidden">
                                                {influencer.avatar_url ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={influencer.avatar_url}
                                                        alt={influencer.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Image
                                                        src={influencer.gender === "male" ? "/default-influencer-male.png" : "/default-influencer-female.png"}
                                                        alt={influencer.name}
                                                        width={400}
                                                        height={400}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                                <div className="absolute bottom-4 right-4">
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 rounded-lg">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        {influencer.status === "ready" ? "Aktif" : influencer.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="text-lg font-bold mb-1">
                                                    {influencer.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mb-3">
                                                    {project.name} için AI Influencer
                                                </p>
                                                {influencer.voice_id && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                                        <Mic className="w-3.5 h-3.5 text-violet-500" />
                                                        Ses Profili Aktif
                                                    </div>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isCreatingInfluencer}
                                                    onClick={async () => {
                                                        if (!confirm('Mevcut influencer silinip yenisi oluşturulacak. Devam etmek istiyor musunuz?')) return;
                                                        try {
                                                            const res = await fetch(`/api/influencer/${influencer.id}`, { method: 'DELETE' });
                                                            if (res.ok) {
                                                                setInfluencer(null);
                                                                // Immediately create a new one
                                                                await handleCreateInfluencer();
                                                            } else {
                                                                console.error('Failed to delete influencer');
                                                            }
                                                        } catch (err) {
                                                            console.error('Influencer recreation failed:', err);
                                                        }
                                                    }}
                                                    className="w-full rounded-lg text-xs border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/30"
                                                >
                                                    {isCreatingInfluencer ? (
                                                        <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Oluşturuluyor...</>
                                                    ) : (
                                                        <><RefreshCw className="w-3 h-3 mr-1.5" /> Yeniden Oluştur</>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 rounded-2xl border border-dashed border-border/50 text-center h-full flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4 overflow-hidden">
                                                <Image
                                                    src={selectedGender === "male" ? "/default-influencer-male.png" : "/default-influencer-female.png"}
                                                    alt="AI Influencer"
                                                    width={80}
                                                    height={80}
                                                    className="w-full h-full object-cover opacity-40"
                                                />
                                            </div>
                                            <h3 className="font-medium mb-1">
                                                AI Influencer Henüz Yok
                                            </h3>
                                            <p className="text-xs text-muted-foreground mb-4">
                                                Cinsiyet seçin ve oluşturun
                                            </p>

                                            {/* Gender Selector */}
                                            <div className="flex gap-2 mb-4 w-full">
                                                <button
                                                    onClick={() => setSelectedGender("female")}
                                                    className={`flex-1 p-3 rounded-xl border text-center transition-all ${selectedGender === "female"
                                                        ? "border-violet-400 bg-violet-500/10 ring-2 ring-violet-400/30"
                                                        : "border-border/50 hover:border-violet-300/50"
                                                        }`}
                                                >
                                                    <div className="w-10 h-10 rounded-full mx-auto mb-1.5 overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200">
                                                        <Image src="/default-influencer-female.png" alt="Kadın" width={40} height={40} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-xs font-medium">Kadın</span>
                                                </button>
                                                <button
                                                    onClick={() => setSelectedGender("male")}
                                                    className={`flex-1 p-3 rounded-xl border text-center transition-all ${selectedGender === "male"
                                                        ? "border-violet-400 bg-violet-500/10 ring-2 ring-violet-400/30"
                                                        : "border-border/50 hover:border-violet-300/50"
                                                        }`}
                                                >
                                                    <div className="w-10 h-10 rounded-full mx-auto mb-1.5 overflow-hidden bg-gradient-to-br from-blue-200 to-indigo-200">
                                                        <Image src="/default-influencer-male.png" alt="Erkek" width={40} height={40} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-xs font-medium">Erkek</span>
                                                </button>
                                            </div>

                                            <Button
                                                size="sm"
                                                onClick={handleCreateInfluencer}
                                                disabled={isCreatingInfluencer}
                                                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 border-0 text-xs"
                                            >
                                                {isCreatingInfluencer ? (
                                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                                )}
                                                {isCreatingInfluencer ? "Oluşturuluyor..." : "Influencer Oluştur"}
                                            </Button>
                                            <AnimatePresence>
                                                {isCreatingInfluencer && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-5 p-4 rounded-xl bg-muted/30 space-y-3 w-full text-left"
                                                    >
                                                        <div className="flex items-center gap-2 text-sm">
                                                            {influencerError ? (
                                                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                                            ) : (
                                                                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                                            )}
                                                            <span>{influencerStep}</span>
                                                        </div>
                                                        <Progress value={influencerProgress} className="h-1.5" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                    className="lg:col-span-2 space-y-5"
                                >
                                    {/* Influencer yok ise büyük oluşturma kartı */}
                                    {!influencer && !isCreatingInfluencer && (
                                        <div className="p-8 rounded-2xl border border-border/50 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                                            <h3 className="text-base font-semibold mb-2">AI Influencer Nedir?</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                                                AI Influencer, projeniz için otomatik oluşturulan sanal bir sözcüdür.
                                                Kişilik profili, ses klonlama ve görsel tasarım ile platformlara özel videolar üretir.
                                            </p>
                                            <div className="grid grid-cols-3 gap-3 mb-5">
                                                {[
                                                    { icon: "🧠", title: "Kişilik", desc: "AI ile benzersiz karakter" },
                                                    { icon: "🎙️", title: "Ses", desc: "ElevenLabs ile klonlama" },
                                                    { icon: "🎬", title: "Video", desc: "Otomatik içerik üretimi" },
                                                ].map((item) => (
                                                    <div key={item.title} className="p-3 rounded-xl bg-background/50 border border-border/50 text-center">
                                                        <div className="text-xl mb-1">{item.icon}</div>
                                                        <h4 className="text-xs font-medium">{item.title}</h4>
                                                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Gender Selector */}
                                            <p className="text-xs font-medium text-muted-foreground mb-3">Influencer Cinsiyeti Seçin</p>
                                            <div className="flex gap-3 mb-5">
                                                <button
                                                    onClick={() => setSelectedGender("female")}
                                                    className={`flex-1 p-4 rounded-xl border text-center transition-all ${selectedGender === "female"
                                                        ? "border-violet-400 bg-violet-500/10 ring-2 ring-violet-400/30"
                                                        : "border-border/50 hover:border-violet-300/50"
                                                        }`}
                                                >
                                                    <div className="w-12 h-12 rounded-full mx-auto mb-2 overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200">
                                                        <Image src="/default-influencer-female.png" alt="Kadın" width={48} height={48} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-xs font-medium">Kadın</span>
                                                </button>
                                                <button
                                                    onClick={() => setSelectedGender("male")}
                                                    className={`flex-1 p-4 rounded-xl border text-center transition-all ${selectedGender === "male"
                                                        ? "border-violet-400 bg-violet-500/10 ring-2 ring-violet-400/30"
                                                        : "border-border/50 hover:border-violet-300/50"
                                                        }`}
                                                >
                                                    <div className="w-12 h-12 rounded-full mx-auto mb-2 overflow-hidden bg-gradient-to-br from-blue-200 to-indigo-200">
                                                        <Image src="/default-influencer-male.png" alt="Erkek" width={48} height={48} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-xs font-medium">Erkek</span>
                                                </button>
                                            </div>

                                            <Button
                                                onClick={handleCreateInfluencer}
                                                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 border-0 shadow-lg shadow-violet-500/20"
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                AI Influencer Oluştur
                                            </Button>
                                        </div>
                                    )}

                                    {/* Backstory */}
                                    {influencer?.backstory && (
                                        <div className="p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                <span>📖</span> Hikayesi
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                                &ldquo;{influencer.backstory}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {/* Personality */}
                                    {influencer?.personality && (
                                        <div className="p-6 rounded-2xl border border-border/50 bg-background/50">
                                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                <span>🧠</span> Kişilik Profili
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {influencer.personality}
                                            </p>
                                        </div>
                                    )}

                                    {/* Quick Video Generate */}
                                    <div
                                        id="quick-video-gen"
                                        className="p-6 rounded-2xl border border-border/50 bg-background/50"
                                    >
                                        <h3 className="text-sm font-semibold mb-1">
                                            Hızlı Video Üret
                                        </h3>
                                        <p className="text-xs text-muted-foreground mb-5">
                                            Platform seçin ve AI videoyu otomatik oluştursun
                                        </p>

                                        <div className="grid grid-cols-3 gap-3">
                                            {(
                                                [
                                                    {
                                                        key: "instagram" as const,
                                                        label: "Instagram",
                                                        icon: "📸",
                                                        desc: "Reels (60s)",
                                                    },
                                                    {
                                                        key: "tiktok" as const,
                                                        label: "TikTok",
                                                        icon: "🎵",
                                                        desc: "Short (60s)",
                                                    },
                                                    {
                                                        key: "linkedin" as const,
                                                        label: "LinkedIn",
                                                        icon: "💼",
                                                        desc: "Video (120s)",
                                                    },
                                                ]
                                            ).map((platform) => (
                                                <button
                                                    key={platform.key}
                                                    onClick={() => handleGenerateVideo(platform.key)}
                                                    disabled={isGenerating}
                                                    className="group p-4 rounded-xl border border-border/50 hover:border-violet-300/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <div className="text-2xl mb-2">{platform.icon}</div>
                                                    <h4 className="text-sm font-medium group-hover:text-violet-600 transition-colors">
                                                        {platform.label}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {platform.desc}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>

                                        <AnimatePresence>
                                            {isGenerating && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-5 p-4 rounded-xl bg-muted/30 space-y-3"
                                                >
                                                    <div className="flex items-center gap-2 text-sm">
                                                        {genError ? (
                                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                                        ) : (
                                                            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                                        )}
                                                        <span className="capitalize">
                                                            {generatingPlatform}
                                                        </span>{" "}
                                                        — {genStep}
                                                    </div>
                                                    <Progress value={genProgress} className="h-1.5" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            </div>

                            {/* A/B Ad Copy Variations — Full Width */}
                            <div className="p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-base font-semibold flex items-center gap-2">
                                        <Megaphone className="w-5 h-5 text-emerald-500" />
                                        Reklam Metinleri (A/B Varyasyonları)
                                    </h3>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isGeneratingAdCopy}
                                        onClick={async () => {
                                            setIsGeneratingAdCopy(true);
                                            try {
                                                const res = await fetch('/api/workflows/ad-copy', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ projectId: project.id }),
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setProject(prev => prev ? { ...prev, ad_copies: data.data } : prev);
                                                }
                                            } catch (e) {
                                                console.error('Ad copy generation failed:', e);
                                            } finally {
                                                setIsGeneratingAdCopy(false);
                                            }
                                        }}
                                        className="rounded-lg text-xs"
                                    >
                                        {isGeneratingAdCopy ? (
                                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Üretiliyor...</>
                                        ) : (
                                            <><Wand2 className="w-3 h-3 mr-1.5" /> {project.ad_copies ? 'Yeniden Üret' : 'Metinleri Üret'}</>
                                        )}
                                    </Button>
                                </div>

                                {project.ad_copies?.variations && project.ad_copies.variations.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        {project.ad_copies.variations.map((ad) => (
                                            <div key={ad.id} className="p-4 rounded-xl bg-background/60 border border-border/30 flex flex-col justify-between gap-3">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className="text-xs rounded-md">
                                                            {ad.approach}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs rounded-md">
                                                            {ad.platform}
                                                        </Badge>
                                                    </div>
                                                    <h4 className="font-bold text-sm leading-snug">{ad.headline}</h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{ad.body}</p>
                                                </div>
                                                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate mr-2">
                                                        {ad.cta}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 px-2 text-xs shrink-0"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(
                                                                `${ad.headline}\n\n${ad.body}\n\n${ad.cta}`
                                                            );
                                                            setCopiedAdId(ad.id);
                                                            setTimeout(() => setCopiedAdId(null), 2000);
                                                        }}
                                                    >
                                                        {copiedAdId === ad.id ? (
                                                            <><CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Kopyalandı</>
                                                        ) : (
                                                            <><Copy className="w-3 h-3 mr-1" /> Kopyala</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {isGeneratingAdCopy ? 'Reklam metinleri üretiliyor, lütfen bekleyin...' : 'Henüz reklam metni üretilmedi. "Metinleri Üret" butonuna tıklayın.'}
                                    </p>
                                )}
                            </div>
                        </TabsContent>

                        {/* ═══ VIDEOS TAB ═══ */}
                        <TabsContent value="videos" className="space-y-6">
                            {videos.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="text-center py-16"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Video className="w-8 h-8 text-violet-500" />
                                    </div>
                                    <h3 className="font-bold mb-2">Henüz Video Yok</h3>
                                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                                        AI Influencer sekmesinden ilk videonuzu otomatik olarak
                                        oluşturun
                                    </p>
                                    <Button
                                        onClick={() => setActiveTab("influencer")}
                                        className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 border-0 shadow-lg shadow-violet-500/20"
                                    >
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Video Oluştur
                                    </Button>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {videos.map((video, index) => {
                                            const statusInfo = getStatusBadge(video.status);
                                            return (
                                                <motion.div
                                                    key={video.id}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                >
                                                    <div
                                                        onClick={() => video.status === 'ready' && setSelectedVideo(video)}
                                                        className={`rounded-2xl border border-border/50 bg-background/50 overflow-hidden group hover:border-violet-300/50 transition-all ${video.status === 'ready' ? 'cursor-pointer' : ''}`}
                                                    >
                                                        {/* Video Preview */}
                                                        <div
                                                            className={`aspect-video bg-gradient-to-br ${getPlatformColor(video.platform)} relative flex items-center justify-center`}
                                                        >
                                                            <div className="absolute inset-0 bg-black/30" />
                                                            {video.status === "ready" ? (
                                                                <button className="relative z-10 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                                                    <Play className="w-6 h-6 text-white ml-0.5" />
                                                                </button>
                                                            ) : (
                                                                <div className="relative z-10 flex flex-col items-center gap-2">
                                                                    <Loader2 className="w-8 h-8 animate-spin text-white/80" />
                                                                    <span className="text-xs text-white/60">
                                                                        İşleniyor...
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="absolute top-3 left-3 z-10">
                                                                <Badge
                                                                    className={`${statusInfo.color} text-[10px] rounded-lg`}
                                                                    variant="outline"
                                                                >
                                                                    {statusInfo.text}
                                                                </Badge>
                                                            </div>
                                                            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                                                                {video.duration_seconds && (
                                                                    <Badge className="bg-black/30 text-white border-0 text-[10px] backdrop-blur-sm rounded-lg">
                                                                        {video.duration_seconds}s
                                                                    </Badge>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (!confirm('Bu videoyu silmek istediğinizden emin misiniz?')) return
                                                                        fetch(`/api/videos/${video.id}`, { method: 'DELETE' })
                                                                            .then(res => {
                                                                                if (res.ok) {
                                                                                    setVideos(prev => prev.filter(v => v.id !== video.id))
                                                                                }
                                                                            })
                                                                    }}
                                                                    className="w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                                                    title="Videoyu Sil"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 text-white" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <h3 className="font-medium text-sm mb-2">
                                                                {video.title || `${video.platform} videosu`}
                                                            </h3>
                                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                <span className="capitalize">
                                                                    {video.platform}
                                                                </span>
                                                                <span>{timeAgo(video.created_at)}</span>
                                                            </div>
                                                            {video.status === "ready" && (
                                                                <div className="flex gap-2 mt-3">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="flex-1 h-8 text-xs rounded-lg border-border/50"
                                                                    >
                                                                        <Download className="w-3 h-3 mr-1" />
                                                                        İndir
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        className="flex-1 h-8 text-xs rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 border-0"
                                                                    >
                                                                        <Share2 className="w-3 h-3 mr-1" />
                                                                        Yayınla
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {/* Generate New Video Card */}
                                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                            <div
                                                onClick={() => setActiveTab("influencer")}
                                                className="rounded-2xl border border-dashed border-border/50 hover:border-violet-300/50 transition-all cursor-pointer h-full flex items-center justify-center min-h-[280px]"
                                            >
                                                <div className="text-center p-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                                        <Wand2 className="w-5 h-5 text-muted-foreground/60" />
                                                    </div>
                                                    <h3 className="font-medium text-sm text-muted-foreground">
                                                        Yeni Video Üret
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground/50 mt-1">
                                                        AI ile otomatik oluştur
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Video Detail Dialog */}
                                    <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
                                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <Video className="w-5 h-5 text-violet-500" />
                                                    {selectedVideo?.title || 'Video Detayı'}
                                                </DialogTitle>
                                            </DialogHeader>
                                            {selectedVideo && (
                                                <div className="space-y-6 mt-2">
                                                    {/* Platform & Duration */}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <Badge className="bg-violet-500/10 text-violet-600 border-violet-200 capitalize">
                                                            📱 {selectedVideo.platform}
                                                        </Badge>
                                                        {selectedVideo.duration_seconds && (
                                                            <Badge variant="outline" className="border-border/50">
                                                                ⏱ {selectedVideo.duration_seconds}s
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50">
                                                            ✅ Hazır
                                                        </Badge>
                                                    </div>

                                                    {/* Hook */}
                                                    {selectedVideo.metadata?.hook && (
                                                        <div className="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 p-4 border border-violet-100 dark:border-violet-800/30">
                                                            <h4 className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">🎣 Hook</h4>
                                                            <p className="text-sm font-medium">{selectedVideo.metadata.hook}</p>
                                                        </div>
                                                    )}

                                                    {/* Script */}
                                                    {selectedVideo.script && (
                                                        <div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                                    Video Script
                                                                </h4>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs rounded-lg"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(selectedVideo.script || '');
                                                                    }}
                                                                >
                                                                    📋 Kopyala
                                                                </Button>
                                                            </div>
                                                            <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
                                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                                    {selectedVideo.script}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* CTA */}
                                                    {selectedVideo.metadata?.cta && (
                                                        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 border border-amber-100 dark:border-amber-800/30">
                                                            <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">📢 Call to Action</h4>
                                                            <p className="text-sm font-medium">{selectedVideo.metadata.cta}</p>
                                                        </div>
                                                    )}

                                                    {/* Hashtags */}
                                                    {selectedVideo.metadata?.hashtags && selectedVideo.metadata.hashtags.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                                # Hashtag{"'"}ler
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {selectedVideo.metadata.hashtags.map((tag: string, i: number) => (
                                                                    <Badge
                                                                        key={i}
                                                                        variant="outline"
                                                                        className="text-xs bg-blue-50 dark:bg-blue-950/20 text-blue-600 border-blue-200 dark:border-blue-800/30"
                                                                    >
                                                                        #{tag.replace(/^#/, '')}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="mt-2 h-7 text-xs"
                                                                onClick={() => {
                                                                    const tags = (selectedVideo.metadata?.hashtags || []).map((t: string) => `#${t.replace(/^#/, '')}`).join(' ');
                                                                    navigator.clipboard.writeText(tags);
                                                                }}
                                                            >
                                                                📋 Hashtag{"'"}leri Kopyala
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Video Player or Status */}
                                                    {selectedVideo.video_url ? (
                                                        <div className="rounded-xl overflow-hidden border border-border/50 bg-black">
                                                            <video
                                                                src={selectedVideo.video_url}
                                                                controls
                                                                className="w-full aspect-[9/16] max-h-[400px] object-contain"
                                                                poster={selectedVideo.thumbnail_url || undefined}
                                                            />
                                                        </div>
                                                    ) : selectedVideo.status === 'rendering' ? (
                                                        <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-100 dark:border-violet-800/30 p-6 text-center">
                                                            <div className="relative mx-auto w-12 h-12 mb-3">
                                                                <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                                                                <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-violet-500/10">
                                                                    <Video className="w-6 h-6 text-violet-500 animate-pulse" />
                                                                </div>
                                                            </div>
                                                            <p className="text-sm font-medium text-violet-600 mb-1">Video Render Ediliyor...</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Abacus AI video oluşturuyor. Bu işlem 1-3 dakika sürebilir.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/30 p-4">
                                                            <p className="text-xs text-blue-600 flex items-center gap-2">
                                                                <Sparkles className="w-4 h-4" />
                                                                Script ve ses üretimi tamamlandı. Video Abacus AI tarafından render edildikten sonra burada izleyebileceksiniz.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </>
                            )}

                            {/* ═══ STORYBOARD SECTION ═══ */}
                            {videos.some(v => v.storyboard?.scenes?.length) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    className="mt-8 space-y-6"
                                >
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <span className="text-2xl">🎬</span> Storyboard & Hook'lar
                                    </h3>
                                    {videos.filter(v => v.storyboard).map((video) => (
                                        <div key={`sb-${video.id}`} className="space-y-4">
                                            {/* Hook Variations */}
                                            {video.storyboard?.hookVariations && video.storyboard.hookVariations.length > 0 && (
                                                <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                        <span>🪝</span> Hook Varyasyonları
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {video.storyboard.hookVariations.map((hook) => (
                                                            <div
                                                                key={hook.id}
                                                                className={`rounded-lg p-3 border text-sm ${hook.id === video.storyboard?.selectedHook
                                                                        ? 'border-violet-500 bg-violet-500/10'
                                                                        : 'border-border/30 bg-muted/30'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-xs font-medium text-muted-foreground capitalize">{hook.style}</span>
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${hook.estimatedImpact === 'high' ? 'bg-green-500/20 text-green-400' :
                                                                            hook.estimatedImpact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                'bg-gray-500/20 text-gray-400'
                                                                        }`}>{hook.estimatedImpact}</span>
                                                                </div>
                                                                <p className="font-medium">&ldquo;{hook.text}&rdquo;</p>
                                                                {hook.id === video.storyboard?.selectedHook && (
                                                                    <span className="text-xs text-violet-400 mt-1 block">✓ Seçili Hook</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Scene Timeline */}
                                            {video.storyboard?.scenes && video.storyboard.scenes.length > 0 && (
                                                <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                        <span>🎞️</span> Sahne Planı ({video.storyboard.totalDuration}s)
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {video.storyboard.scenes.map((scene) => (
                                                            <div key={scene.sceneNumber} className="flex gap-3 rounded-lg bg-muted/20 p-3">
                                                                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-violet-500/10 flex flex-col items-center justify-center">
                                                                    <span className="text-lg font-bold text-violet-400">{scene.sceneNumber}</span>
                                                                    <span className="text-[10px] text-muted-foreground">{scene.startSecond}-{scene.endSecond}s</span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{scene.cameraDirection}</span>
                                                                        <span className="text-xs px-2 py-0.5 rounded bg-pink-500/20 text-pink-400">{scene.emotion}</span>
                                                                    </div>
                                                                    <p className="text-sm font-medium truncate">&ldquo;{scene.narration}&rdquo;</p>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">{scene.visualDescription}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Problem-Solution Map */}
                                            {video.storyboard?.problemSolutionMap && video.storyboard.problemSolutionMap.length > 0 && (
                                                <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                        <span>🎯</span> Problem → Çözüm Eşlemesi
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {video.storyboard.problemSolutionMap.map((item, i) => (
                                                            <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/20">
                                                                <span className="text-red-400 font-medium flex-shrink-0">❌ {item.problem}</span>
                                                                <span className="text-muted-foreground">→</span>
                                                                <span className="text-green-400 font-medium">{item.feature}</span>
                                                                <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{item.videoMoment}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </TabsContent>

                        {/* ═══ ASSETS TAB ═══ */}
                        <TabsContent value="assets" className="space-y-6">
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                <h3 className="text-base font-semibold mb-4">
                                    Ekran Görüntüleri
                                </h3>
                                {screenshots.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {screenshots.map((ss, index) => (
                                            <motion.div
                                                key={ss.id}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                            >
                                                <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden group hover:border-violet-300/50 transition-all cursor-pointer">
                                                    <div className="aspect-[16/10] bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                                                        <ImageIcon className="w-8 h-8 text-muted-foreground/30 group-hover:text-violet-500/50 transition-colors" />
                                                    </div>
                                                    <div className="p-3">
                                                        <p className="text-xs font-medium truncate">
                                                            {ss.original_filename || "Screenshot"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 rounded-2xl border border-dashed border-border/50 text-center">
                                        <ImageIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            Henüz ekran görüntüsü yok
                                        </p>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                                <h3 className="text-base font-semibold mb-4">
                                    Logolar ve Görseller
                                </h3>
                                <div className="p-8 rounded-2xl border border-dashed border-border/50 text-center">
                                    <ImageIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        Logo veya özel görselleri sürükleyip bırakın
                                    </p>
                                    <p className="text-xs text-muted-foreground/50 mt-1">
                                        PNG, JPG, SVG · Max 50MB
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 rounded-xl border-border/50 text-xs"
                                    >
                                        Dosya Seç
                                    </Button>
                                </div>
                            </motion.div>
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </main >
        </div >
    );
}
