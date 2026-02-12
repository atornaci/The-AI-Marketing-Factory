"use client";

import { useState, use } from "react";
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
} from "lucide-react";
import Link from "next/link";

// Demo data for project detail
const projectData = {
    id: "1",
    name: "MyResumeFit.AI",
    url: "https://myresumefit.ai",
    description:
        "AI-destekli özgeçmiş optimizasyonu ve iş eşleştirme platformu. Kullanıcıların iş ilanlarına özel özgeçmişlerini optimize etmelerini sağlar.",
    status: "completed" as const,
    favicon: "🎯",
    analysis: {
        valueProposition:
            "İş arayanların başvuru sürecini AI ile hızlandırın - %87 daha yüksek geri dönüş oranı",
        targetAudience: {
            demographics: ["25-45 yaş profesyoneller", "Yeni mezunlar", "Kariyer değişikliği yapanlar"],
            interests: ["Kariyer gelişimi", "AI araçları", "Verimlilik"],
            painPoints: [
                "ATS filtrelerini geçememe",
                "Her iş ilanına ayrı CV hazırlama",
                "Düşük başvuru dönüş oranları",
            ],
        },
        competitors: ["Resume.io", "Zety", "Kickresume"],
        brandTone: "Professional, güven veren, technoloji odaklı",
    },
    constitution: {
        brandVoice:
            "Profesyonel ama samimi. Kariyerlerinde yol gösteren güvenilir bir danışman gibi konuşur.",
        contentPillars: [
            "AI-Destekli Kariyer Rehberliği",
            "Başarı Hikayeleri",
            "İş Arama İpuçları",
        ],
        visualGuidelines: {
            colorPalette: ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4"],
            mood: "Modern, güvenilir, profesyonel",
            style: "Temiz çizgiler, canlı gradyanlar",
        },
    },
};

const influencerData = {
    name: "Alex Nova",
    personality:
        "Samimi, profesyonel ve teknoloji tutkunu. Kariyerlerinde fark yaratmak isteyenlere ilham veriyor.",
    voiceName: "Professional Male - Turkish",
    status: "ready" as const,
    avatarEmoji: "🤖",
};

const videosData = [
    {
        id: "v1",
        title: "MyResumeFit.AI ile ATS'yi Geçin!",
        platform: "instagram" as const,
        status: "ready" as const,
        duration: 45,
        views: "12.5K",
        createdAt: "2 saat önce",
    },
    {
        id: "v2",
        title: "30 Saniyede CV Optimizasyonu",
        platform: "tiktok" as const,
        status: "ready" as const,
        duration: 30,
        views: "28.3K",
        createdAt: "5 saat önce",
    },
    {
        id: "v3",
        title: "AI Kariyer Danışmanınızla Tanışın",
        platform: "linkedin" as const,
        status: "rendering" as const,
        duration: 90,
        views: "-",
        createdAt: "15 dk önce",
    },
];

const screenshots = [
    { name: "Ana Sayfa", emoji: "🏠" },
    { name: "Dashboard", emoji: "📊" },
    { name: "CV Builder", emoji: "📝" },
    { name: "İş Eşleştirme", emoji: "🎯" },
];

export default function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [activeTab, setActiveTab] = useState("overview");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingPlatform, setGeneratingPlatform] = useState("");
    const [genProgress, setGenProgress] = useState(0);

    const handleGenerateVideo = async (
        platform: "instagram" | "tiktok" | "linkedin"
    ) => {
        setIsGenerating(true);
        setGeneratingPlatform(platform);
        setGenProgress(0);

        const genSteps = [
            { progress: 20, label: "Senaryo yazılıyor..." },
            { progress: 40, label: "Ses üretiliyor..." },
            { progress: 60, label: "AI Influencer render ediliyor..." },
            { progress: 80, label: "Ekran görüntüleri ekleniyor..." },
            { progress: 100, label: "Video tamamlandı!" },
        ];

        for (const step of genSteps) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setGenProgress(step.progress);
        }

        setTimeout(() => {
            setIsGenerating(false);
            setGeneratingPlatform("");
        }, 1000);
    };

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

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "ready":
                return { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", text: "Hazır" };
            case "rendering":
                return { color: "bg-violet-500/15 text-violet-400 border-violet-500/20", text: "İşleniyor" };
            case "draft":
                return { color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20", text: "Taslak" };
            default:
                return { color: "", text: status };
        }
    };

    return (
        <div className="min-h-screen bg-background grid-bg">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">{projectData.favicon}</div>
                            <div>
                                <h1 className="text-lg font-bold">{projectData.name}</h1>
                                <a
                                    href={projectData.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-violet-400 transition-colors flex items-center gap-1"
                                >
                                    {projectData.url}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 hover:bg-white/5"
                        >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Yeniden Analiz
                        </Button>
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-violet-600 to-purple-500 border-0"
                        >
                            <Video className="w-3.5 h-3.5 mr-1.5" />
                            Video Üret
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
                        <TabsTrigger
                            value="overview"
                            className="rounded-lg data-[state=active]:bg-white/10"
                        >
                            <Monitor className="w-4 h-4 mr-1.5" />
                            Genel Bakış
                        </TabsTrigger>
                        <TabsTrigger
                            value="influencer"
                            className="rounded-lg data-[state=active]:bg-white/10"
                        >
                            <Bot className="w-4 h-4 mr-1.5" />
                            AI Influencer
                        </TabsTrigger>
                        <TabsTrigger
                            value="videos"
                            className="rounded-lg data-[state=active]:bg-white/10"
                        >
                            <Video className="w-4 h-4 mr-1.5" />
                            Videolar
                        </TabsTrigger>
                        <TabsTrigger
                            value="assets"
                            className="rounded-lg data-[state=active]:bg-white/10"
                        >
                            <ImageIcon className="w-4 h-4 mr-1.5" />
                            Görseller
                        </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Value Proposition */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="lg:col-span-2"
                            >
                                <Card className="glass border-white/15 h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Target className="w-4 h-4 text-violet-400" />
                                            Değer Önerisi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-lg font-medium mb-4">
                                            {projectData.analysis.valueProposition}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {projectData.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Brand Tone */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="glass border-white/15 h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Shield className="w-4 h-4 text-violet-400" />
                                            Marka Sesi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {projectData.constitution.brandVoice}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {projectData.constitution.visualGuidelines.colorPalette.map(
                                                (color) => (
                                                    <div
                                                        key={color}
                                                        className="w-6 h-6 rounded-full border border-white/10"
                                                        style={{ background: color }}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Target Audience */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="glass border-white/15">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Users className="w-4 h-4 text-violet-400" />
                                            Hedef Kitle
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {projectData.analysis.targetAudience.demographics.map(
                                            (demo) => (
                                                <Badge
                                                    key={demo}
                                                    variant="outline"
                                                    className="mr-1.5 bg-white/5 border-white/10"
                                                >
                                                    {demo}
                                                </Badge>
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Pain Points */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="glass border-white/15">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Zap className="w-4 h-4 text-violet-400" />
                                            Sorun Noktaları
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {projectData.analysis.targetAudience.painPoints.map(
                                                (pain) => (
                                                    <li
                                                        key={pain}
                                                        className="text-sm text-muted-foreground flex items-start gap-2"
                                                    >
                                                        <span className="text-rose-400 mt-0.5">•</span>
                                                        {pain}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Content Pillars */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Card className="glass border-white/15">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <FileText className="w-4 h-4 text-violet-400" />
                                            İçerik Sütunları
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {projectData.constitution.contentPillars.map(
                                                (pillar, i) => (
                                                    <li
                                                        key={pillar}
                                                        className="text-sm flex items-center gap-2"
                                                    >
                                                        <span className="text-violet-400 font-bold text-xs">
                                                            {String(i + 1).padStart(2, "0")}
                                                        </span>
                                                        {pillar}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </TabsContent>

                    {/* INFLUENCER TAB */}
                    <TabsContent value="influencer" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="lg:col-span-1"
                            >
                                <Card className="glass border-white/15 overflow-hidden">
                                    <div className="aspect-square bg-gradient-to-br from-violet-600/20 to-purple-500/20 flex items-center justify-center relative">
                                        <div className="text-8xl">{influencerData.avatarEmoji}</div>
                                        <div className="absolute bottom-4 right-4">
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Aktif
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <h3 className="text-xl font-bold mb-1">
                                            {influencerData.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {projectData.name} için AI Influencer
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mic className="w-3.5 h-3.5 text-violet-400" />
                                            {influencerData.voiceName}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="lg:col-span-2 space-y-6"
                            >
                                <Card className="glass border-white/15">
                                    <CardHeader>
                                        <CardTitle className="text-base">Kişilik Profili</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {influencerData.personality}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="glass border-white/15">
                                    <CardHeader>
                                        <CardTitle className="text-base">Hızlı Video Üret</CardTitle>
                                        <CardDescription>
                                            Platform seçin ve AI videoyu otomatik oluştursun
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(
                                                [
                                                    {
                                                        key: "instagram",
                                                        label: "Instagram",
                                                        icon: "📸",
                                                        desc: "Reels (60s)",
                                                    },
                                                    {
                                                        key: "tiktok",
                                                        label: "TikTok",
                                                        icon: "🎵",
                                                        desc: "Short (60s)",
                                                    },
                                                    {
                                                        key: "linkedin",
                                                        label: "LinkedIn",
                                                        icon: "💼",
                                                        desc: "Video (120s)",
                                                    },
                                                ] as const
                                            ).map((platform) => (
                                                <button
                                                    key={platform.key}
                                                    onClick={() => handleGenerateVideo(platform.key)}
                                                    disabled={isGenerating}
                                                    className="group p-4 rounded-xl glass border border-white/15 hover:border-violet-500/30 transition-all duration-300 text-left disabled:opacity-50"
                                                >
                                                    <div className="text-2xl mb-2">{platform.icon}</div>
                                                    <h4 className="text-sm font-medium group-hover:text-violet-300 transition-colors">
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
                                                    className="mt-4 p-4 rounded-xl bg-white/5 space-y-3"
                                                >
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                                                        <span className="capitalize">
                                                            {generatingPlatform}
                                                        </span>{" "}
                                                        videosu üretiliyor...
                                                    </div>
                                                    <Progress
                                                        value={genProgress}
                                                        className="h-2 bg-white/5"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </TabsContent>

                    {/* VIDEOS TAB */}
                    <TabsContent value="videos" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {videosData.map((video, index) => {
                                const statusInfo = getStatusInfo(video.status);
                                return (
                                    <motion.div
                                        key={video.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="glass border-white/15 overflow-hidden group hover:border-violet-500/20 transition-all">
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
                                                        className={`${statusInfo.color} text-[10px]`}
                                                        variant="outline"
                                                    >
                                                        {statusInfo.text}
                                                    </Badge>
                                                </div>
                                                <div className="absolute top-3 right-3 z-10">
                                                    <Badge className="bg-black/30 text-white border-0 text-[10px] backdrop-blur-sm">
                                                        {video.duration}s
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardContent className="p-4">
                                                <h3 className="font-medium text-sm mb-2">
                                                    {video.title}
                                                </h3>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-3">
                                                        <span className="capitalize">{video.platform}</span>
                                                        {video.views !== "-" && (
                                                            <span>👁 {video.views}</span>
                                                        )}
                                                    </div>
                                                    <span>{video.createdAt}</span>
                                                </div>
                                                {video.status === "ready" && (
                                                    <div className="flex gap-2 mt-3">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 h-8 text-xs border-white/10"
                                                        >
                                                            <Download className="w-3 h-3 mr-1" />
                                                            İndir
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 h-8 text-xs bg-gradient-to-r from-violet-600 to-purple-500 border-0"
                                                        >
                                                            <Share2 className="w-3 h-3 mr-1" />
                                                            Yayınla
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}

                            {/* Generate New Video Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="glass border-dashed border-white/10 hover:border-violet-500/30 transition-all cursor-pointer h-full flex items-center justify-center min-h-[300px]">
                                    <div className="text-center p-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <Wand2 className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <h3 className="font-medium text-muted-foreground">
                                            Yeni Video Üret
                                        </h3>
                                        <p className="text-xs text-muted-foreground/60 mt-1">
                                            AI ile otomatik video oluştur
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    </TabsContent>

                    {/* ASSETS TAB */}
                    <TabsContent value="assets" className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Ekran Görüntüleri</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {screenshots.map((ss, index) => (
                                    <motion.div
                                        key={ss.name}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="glass border-white/15 overflow-hidden group hover:border-violet-500/20 transition-all cursor-pointer">
                                            <div className="aspect-[16/10] bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                                                <span className="text-4xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">
                                                    {ss.emoji}
                                                </span>
                                            </div>
                                            <CardContent className="p-3">
                                                <p className="text-xs font-medium">{ss.name}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Logolar ve Görseller</h3>
                            <Card className="glass border-dashed border-white/10 p-8 text-center">
                                <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                                <p className="text-sm text-muted-foreground">
                                    Logo veya özel görselleri sürükleyip bırakın
                                </p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    PNG, JPG, SVG · Max 50MB
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 border-white/10"
                                >
                                    Dosya Seç
                                </Button>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
