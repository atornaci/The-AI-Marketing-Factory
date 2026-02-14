"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
    Sparkles,
    Plus,
    Globe,
    Video,
    Bot,
    ArrowRight,
    ExternalLink,
    Clock,
    TrendingUp,
    Eye,
    Loader2,
    Search,
    LogOut,
    Zap,
    BarChart3,
    Layers,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ─── */
interface ProjectItem {
    id: string;
    name: string;
    url: string;
    status: "pending" | "analyzing" | "completed" | "failed";
    videoCount: number;
    influencer?: string;
    lastActivity: string;
    favicon?: string;
}

interface StatItem {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    change: string;
    gradient: string;
    iconColor: string;
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
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialUrl = searchParams.get("url") || "";
    const supabase = createClient();

    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [stats, setStats] = useState<StatItem[]>([]);
    const [newProjectUrl, setNewProjectUrl] = useState(initialUrl);
    const [isCreating, setIsCreating] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(!!initialUrl);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisStep, setAnalysisStep] = useState("");
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth");
                return;
            }
            setUserEmail(user.email || "");

            const { data: projectsData } = await supabase
                .from("projects")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            // videos and ai_influencers don't have user_id — filter by project_id
            const projectIds = (projectsData || []).map((p: { id: string }) => p.id);

            const { data: videosData } = projectIds.length > 0
                ? await supabase
                    .from("videos")
                    .select("project_id")
                    .in("project_id", projectIds)
                : { data: [] as { project_id: string }[] };

            const { data: influencersData } = projectIds.length > 0
                ? await supabase
                    .from("ai_influencers")
                    .select("id, name, project_id")
                    .in("project_id", projectIds)
                : { data: [] as { id: string; name: string; project_id: string }[] };

            const videoCounts: Record<string, number> = {};
            videosData?.forEach((v) => {
                videoCounts[v.project_id] = (videoCounts[v.project_id] || 0) + 1;
            });

            const influencerMap: Record<string, string> = {};
            influencersData?.forEach((i) => {
                if (i.project_id) influencerMap[i.project_id] = i.name;
            });

            const mappedProjects: ProjectItem[] = (projectsData || []).map((p) => ({
                id: p.id,
                name: p.name || new URL(p.url).hostname,
                url: p.url,
                status: p.analysis_status || "completed",
                videoCount: videoCounts[p.id] || 0,
                influencer: influencerMap[p.id],
                lastActivity: timeAgo(p.updated_at || p.created_at),
                favicon: "🌐",
            }));

            setProjects(mappedProjects);

            const totalProjects = mappedProjects.length;
            const totalVideos = videosData?.length || 0;
            const totalInfluencers = influencersData?.length || 0;

            setStats([
                {
                    label: "Toplam Proje",
                    value: String(totalProjects),
                    icon: Layers,
                    change: totalProjects > 0 ? `${totalProjects} aktif` : "Yeni",
                    gradient: "from-blue-500 to-cyan-500",
                    iconColor: "text-blue-500 bg-blue-500/10",
                },
                {
                    label: "Üretilen Video",
                    value: String(totalVideos),
                    icon: Video,
                    change: totalVideos > 0 ? `${totalVideos} üretildi` : "—",
                    gradient: "from-violet-500 to-purple-500",
                    iconColor: "text-violet-500 bg-violet-500/10",
                },
                {
                    label: "AI Influencer",
                    value: String(totalInfluencers),
                    icon: Bot,
                    change: totalInfluencers > 0 ? "Aktif" : "—",
                    gradient: "from-pink-500 to-rose-500",
                    iconColor: "text-pink-500 bg-pink-500/10",
                },
                {
                    label: "Toplam İzlenme",
                    value: "—",
                    icon: BarChart3,
                    change: "Yakında",
                    gradient: "from-orange-500 to-amber-500",
                    iconColor: "text-orange-500 bg-orange-500/10",
                },
            ]);
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateProject = async () => {
        if (!newProjectUrl) return;
        setIsCreating(true);
        setAnalysisProgress(0);

        const steps = [
            { progress: 10, label: "URL doğrulanıyor..." },
            { progress: 25, label: "Web sitesi taranıyor..." },
            { progress: 45, label: "AI ile proje analizi yapılıyor..." },
            { progress: 65, label: "Pazarlama Anayasası oluşturuluyor..." },
            { progress: 80, label: "Veritabanına kaydediliyor..." },
        ];

        let currentStep = 0;
        const progressInterval = setInterval(() => {
            if (currentStep < steps.length) {
                setAnalysisProgress(steps[currentStep].progress);
                setAnalysisStep(steps[currentStep].label);
                currentStep++;
            }
        }, 3000);

        try {
            const url = newProjectUrl.startsWith("http")
                ? newProjectUrl
                : `https://${newProjectUrl}`;

            const response = await fetch("/api/workflows/onboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Proje oluşturulamadı");
            }

            setAnalysisProgress(100);
            setAnalysisStep("Tamamlandı! ✓");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            await fetchData();
            setCreateDialogOpen(false);
            setNewProjectUrl("");
        } catch (err) {
            clearInterval(progressInterval);
            setAnalysisStep(
                `Hata: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`
            );
        } finally {
            setIsCreating(false);
            setAnalysisProgress(0);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/auth");
        router.refresh();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-emerald-50 text-emerald-600 border-emerald-200";
            case "analyzing":
                return "bg-violet-50 text-violet-600 border-violet-200";
            case "pending":
                return "bg-amber-50 text-amber-600 border-amber-200";
            case "failed":
                return "bg-red-50 text-red-600 border-red-200";
            default:
                return "";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "completed":
                return "Tamamlandı";
            case "analyzing":
                return "Analiz Ediliyor";
            case "pending":
                return "Bekliyor";
            case "failed":
                return "Hata";
            default:
                return status;
        }
    };

    const filteredProjects = projects.filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <p className="text-xs text-muted-foreground mt-1">
                            Dashboard hazırlanıyor
                        </p>
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
                <div className="absolute inset-0 grid-bg opacity-30" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/[0.03] rounded-full blur-[100px]" />
            </div>

            {/* ═══ Header ═══ */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Left: Logo */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Sparkles className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight hidden sm:block">
                            AI Marketing <span className="gradient-text">Factory</span>
                        </span>
                    </Link>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            <Input
                                placeholder="Proje ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-56 h-9 rounded-xl border-border/50 bg-background/50 text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                            />
                        </div>

                        {/* New Project */}
                        <Dialog
                            open={createDialogOpen}
                            onOpenChange={setCreateDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button className="h-9 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 shadow-lg shadow-violet-500/20 text-sm font-medium">
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Yeni Proje
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="border-border/50 sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold">
                                        Yeni Proje Oluştur
                                    </DialogTitle>
                                    <DialogDescription>
                                        Pazarlamak istediğiniz web projesinin URL&apos;sini girin.
                                        AI sistemi analiz edip size özel strateji oluşturacak.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="relative group">
                                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-violet-400 transition-colors" />
                                        <Input
                                            placeholder="https://example.com"
                                            value={newProjectUrl}
                                            onChange={(e) => setNewProjectUrl(e.target.value)}
                                            className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {isCreating && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-3"
                                            >
                                                <Progress
                                                    value={analysisProgress}
                                                    className="h-1.5"
                                                />
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                                                    {analysisStep}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <Button
                                        onClick={handleCreateProject}
                                        disabled={!newProjectUrl || isCreating}
                                        className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 text-base font-semibold shadow-lg shadow-violet-500/25"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Analiz Ediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Projeyi Analiz Et
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* User */}
                        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-border/50">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center text-xs font-semibold text-violet-500">
                                    {userEmail.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs text-muted-foreground hidden lg:block max-w-[140px] truncate">
                                    {userEmail}
                                </span>
                            </div>
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
            <main className="relative max-w-7xl mx-auto px-6 py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* ─── Welcome Banner ─── */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Hoş geldin 👋
                                </h1>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Projelerini yönet ve yeni içerikler üret
                                </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-background/50 text-xs">
                                <Zap className="w-3 h-3 text-violet-500" />
                                <span className="text-muted-foreground">
                                    AI Otonom Motor Aktif
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── Stats Grid ─── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        {stats.map((stat) => (
                            <motion.div key={stat.label} variants={itemVariants}>
                                <div className="p-5 rounded-2xl border border-border/50 bg-background/50 hover:border-border transition-colors group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconColor}`}
                                        >
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {stat.change}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold tracking-tight">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {stat.label}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ─── Projects Section ─── */}
                    <motion.div variants={itemVariants} className="mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">
                                    Projelerim
                                </h2>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {projects.length > 0
                                        ? `${projects.length} aktif proje`
                                        : "Henüz proje yok — hemen başla!"}
                                </p>
                            </div>
                            {projects.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCreateDialogOpen(true)}
                                    className="rounded-xl border-border/50 text-xs h-8"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Ekle
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Project Cards */}
                            {filteredProjects.map((project, index) => (
                                <motion.div
                                    key={project.id}
                                    variants={itemVariants}
                                    custom={index}
                                >
                                    <Link href={`/project/${project.id}`}>
                                        <div className="group p-5 rounded-2xl border border-border/50 bg-background/50 hover:border-violet-300/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 cursor-pointer h-full">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center text-lg">
                                                        {project.favicon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-sm group-hover:text-violet-600 transition-colors">
                                                            {project.name}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <ExternalLink className="w-2.5 h-2.5" />
                                                            <span className="truncate max-w-[160px]">
                                                                {project.url}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-medium rounded-lg ${getStatusColor(project.status)}`}
                                                >
                                                    {getStatusText(project.status)}
                                                </Badge>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                                <span className="flex items-center gap-1.5">
                                                    <Video className="w-3.5 h-3.5" />
                                                    {project.videoCount} video
                                                </span>
                                                {project.influencer && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Bot className="w-3.5 h-3.5" />
                                                        {project.influencer}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-border/30">
                                                <div className="flex -space-x-1.5">
                                                    {["I", "T", "L"].map((letter) => (
                                                        <div
                                                            key={letter}
                                                            className="w-5 h-5 rounded-full bg-muted/80 flex items-center justify-center text-[9px] font-medium border-2 border-background"
                                                        >
                                                            {letter}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                                                        <Clock className="w-3 h-3" />
                                                        {project.lastActivity}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}

                            {/* ─── New Project Card ─── */}
                            <motion.div variants={itemVariants}>
                                <Dialog
                                    open={createDialogOpen}
                                    onOpenChange={setCreateDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <div className="group p-5 rounded-2xl border border-dashed border-border/50 hover:border-violet-300/50 transition-all duration-300 cursor-pointer h-full flex flex-col items-center justify-center min-h-[200px] text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 group-hover:bg-violet-500/10 transition-colors">
                                                <Plus className="w-5 h-5 text-muted-foreground/60 group-hover:text-violet-500 transition-colors" />
                                            </div>
                                            <h3 className="font-medium text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                                Yeni Proje Ekle
                                            </h3>
                                            <p className="text-xs text-muted-foreground/50 mt-1">
                                                URL girin ve AI analiz etsin
                                            </p>
                                        </div>
                                    </DialogTrigger>
                                </Dialog>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* ─── Empty State ─── */}
                    {projects.length === 0 && (
                        <motion.div
                            variants={itemVariants}
                            className="text-center py-16"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-9 h-9 text-violet-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                                AI Marketing Factory&apos;e Hoşgeldiniz!
                            </h3>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
                                İlk projenizi ekleyin — AI sistemi web sitenizi analiz edecek,
                                influencer oluşturacak ve video içerikler üretecek.
                            </p>
                            <Button
                                onClick={() => setCreateDialogOpen(true)}
                                className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 shadow-lg shadow-violet-500/25 font-medium"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                İlk Projeni Oluştur
                            </Button>

                            {/* Quick tips */}
                            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                {[
                                    {
                                        icon: Globe,
                                        title: "URL Girin",
                                        desc: "Web projenizin adresini paylaşın",
                                    },
                                    {
                                        icon: Bot,
                                        title: "AI Analiz Etsin",
                                        desc: "Otomatik proje analizi yapılır",
                                    },
                                    {
                                        icon: Video,
                                        title: "Video Üretin",
                                        desc: "İçerikler otomatik oluşturulur",
                                    },
                                ].map((tip) => (
                                    <div
                                        key={tip.title}
                                        className="p-4 rounded-xl border border-border/30 text-center"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-2">
                                            <tip.icon className="w-4 h-4 text-violet-500" />
                                        </div>
                                        <p className="text-xs font-medium">{tip.title}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {tip.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                </div>
            }
        >
            <DashboardContent />
        </Suspense>
    );
}
