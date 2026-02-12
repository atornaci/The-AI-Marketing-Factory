"use client";

import { useState, useEffect } from "react";
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
    BarChart3,
    TrendingUp,
    Eye,
    Loader2,
    Search,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

// Demo projects for showcase
const demoProjects: ProjectItem[] = [
    {
        id: "1",
        name: "MyResumeFit.AI",
        url: "https://myresumefit.ai",
        status: "completed",
        videoCount: 12,
        influencer: "Alex Nova",
        lastActivity: "2 saat önce",
        favicon: "🎯",
    },
    {
        id: "2",
        name: "TechStartup Pro",
        url: "https://techstartup.pro",
        status: "analyzing",
        videoCount: 3,
        influencer: "Luna Ray",
        lastActivity: "15 dk önce",
        favicon: "🚀",
    },
    {
        id: "3",
        name: "EcoShop Store",
        url: "https://ecoshop.store",
        status: "completed",
        videoCount: 8,
        influencer: "Sage Green",
        lastActivity: "1 gün önce",
        favicon: "🌿",
    },
];

const stats = [
    {
        label: "Toplam Proje",
        value: "3",
        icon: Globe,
        change: "+2 bu ay",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        label: "Üretilen Video",
        value: "23",
        icon: Video,
        change: "+8 bu hafta",
        gradient: "from-violet-500 to-purple-500",
    },
    {
        label: "AI Influencer",
        value: "3",
        icon: Bot,
        change: "Aktif",
        gradient: "from-pink-500 to-rose-500",
    },
    {
        label: "Toplam İzlenme",
        value: "45.2K",
        icon: Eye,
        change: "+12.3K",
        gradient: "from-orange-500 to-amber-500",
    },
];

function DashboardContent() {
    const searchParams = useSearchParams();
    const initialUrl = searchParams.get("url") || "";
    const [projects, setProjects] = useState<ProjectItem[]>(demoProjects);
    const [newProjectUrl, setNewProjectUrl] = useState(initialUrl);
    const [isCreating, setIsCreating] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(!!initialUrl);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisStep, setAnalysisStep] = useState("");

    const handleCreateProject = async () => {
        if (!newProjectUrl) return;

        setIsCreating(true);
        setAnalysisProgress(0);

        // Simulate analysis steps
        const steps = [
            { progress: 15, label: "URL doğrulanıyor..." },
            { progress: 30, label: "Ekran görüntüsü alınıyor..." },
            { progress: 50, label: "İçerik analiz ediliyor..." },
            { progress: 70, label: "AI ile proje analizi yapılıyor..." },
            { progress: 85, label: "Pazarlama Anayasası oluşturuluyor..." },
            { progress: 100, label: "Tamamlandı! ✓" },
        ];

        for (const step of steps) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setAnalysisProgress(step.progress);
            setAnalysisStep(step.label);
        }

        // Add project
        const newProject: ProjectItem = {
            id: String(projects.length + 1),
            name: new URL(
                newProjectUrl.startsWith("http")
                    ? newProjectUrl
                    : `https://${newProjectUrl}`
            ).hostname,
            url: newProjectUrl,
            status: "completed",
            videoCount: 0,
            lastActivity: "Az önce",
            favicon: "🌐",
        };

        setProjects([newProject, ...projects]);
        setIsCreating(false);
        setNewProjectUrl("");
        setCreateDialogOpen(false);
        setAnalysisProgress(0);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
            case "analyzing":
                return "bg-violet-500/15 text-violet-400 border-violet-500/20";
            case "pending":
                return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
            case "failed":
                return "bg-red-500/15 text-red-400 border-red-500/20";
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

    return (
        <div className="min-h-screen bg-background grid-bg">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-bold hidden sm:block">
                                AI Marketing <span className="gradient-text">Factory</span>
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Proje ara..."
                                className="pl-9 w-64 bg-white/5 border-white/10"
                            />
                        </div>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Yeni Proje
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-strong border-white/10 sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-xl">
                                        Yeni Proje Oluştur
                                    </DialogTitle>
                                    <DialogDescription>
                                        Pazarlamak istediğiniz web projesinin URL&apos;sini girin. AI
                                        sistemi projeyi analiz edip size özel bir pazarlama
                                        stratejisi oluşturacak.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="https://myresumefit.ai"
                                            value={newProjectUrl}
                                            onChange={(e) => setNewProjectUrl(e.target.value)}
                                            className="pl-10 h-12 bg-white/5 border-white/10"
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
                                                    className="h-2 bg-white/5"
                                                />
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                                                    {analysisStep}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <Button
                                        onClick={handleCreateProject}
                                        disabled={!newProjectUrl || isCreating}
                                        className="w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 h-12"
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
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <Card className="glass border-white/15 hover:border-white/25 transition-colors">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div
                                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}
                                        >
                                            <stat.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {stat.change}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Projects Grid */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-1">Projelerim</h2>
                    <p className="text-muted-foreground text-sm mb-6">
                        Aktif projelerinizi yönetin ve yeni pazarlama içerikleri üretin
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <Link href={`/project/${project.id}`}>
                                    <Card className="glass border-white/15 hover:border-violet-500/40 transition-all duration-300 cursor-pointer group h-full">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-2xl">{project.favicon}</div>
                                                    <div>
                                                        <CardTitle className="text-base group-hover:text-violet-300 transition-colors">
                                                            {project.name}
                                                        </CardTitle>
                                                        <CardDescription className="text-xs flex items-center gap-1 mt-0.5">
                                                            <ExternalLink className="w-3 h-3" />
                                                            {project.url}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] ${getStatusColor(project.status)}`}
                                                >
                                                    {getStatusText(project.status)}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Video className="w-3.5 h-3.5" />
                                                        {project.videoCount} video
                                                    </span>
                                                    {project.influencer && (
                                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Bot className="w-3.5 h-3.5" />
                                                            {project.influencer}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                                                    <Clock className="w-3 h-3" />
                                                    {project.lastActivity}
                                                </span>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex -space-x-2">
                                                    {["instagram", "tiktok", "linkedin"].map(
                                                        (platform) => (
                                                            <div
                                                                key={platform}
                                                                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] border-2 border-background"
                                                            >
                                                                {platform[0].toUpperCase()}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}

                        {/* New Project Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: projects.length * 0.1 }}
                        >
                            <Dialog
                                open={createDialogOpen}
                                onOpenChange={setCreateDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Card className="glass border-dashed border-white/15 hover:border-violet-500/40 transition-all duration-300 cursor-pointer group h-full flex items-center justify-center min-h-[200px]">
                                        <div className="text-center p-6">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-violet-500/10 transition-colors">
                                                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                                            </div>
                                            <h3 className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                Yeni Proje Ekle
                                            </h3>
                                            <p className="text-xs text-muted-foreground/60 mt-1">
                                                URL girin ve AI analiz etsin
                                            </p>
                                        </div>
                                    </Card>
                                </DialogTrigger>
                            </Dialog>
                        </motion.div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Son Aktiviteler</h3>
                    <div className="space-y-2">
                        {[
                            {
                                text: "MyResumeFit.AI için Instagram videosu oluşturuldu",
                                time: "2 saat önce",
                                icon: Video,
                            },
                            {
                                text: "Alex Nova influencer profili güncellendi",
                                time: "5 saat önce",
                                icon: Bot,
                            },
                            {
                                text: "TechStartup Pro analizi başlatıldı",
                                time: "15 dk önce",
                                icon: BarChart3,
                            },
                            {
                                text: "EcoShop Store LinkedIn videosu yayınlandı",
                                time: "1 gün önce",
                                icon: Globe,
                            },
                        ].map((activity, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <activity.icon className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm flex-1">{activity.text}</span>
                                <span className="text-xs text-muted-foreground/60">
                                    {activity.time}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
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
