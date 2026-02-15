"use client";

import { N8N_ENDPOINTS } from "@/lib/config/n8n";

import React, { useState, useEffect, use, useCallback, Component } from "react";
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
    Megaphone,
    Upload,
    Settings,
    Clock,
    Link2,
    Unlink,
    Send,
    Calendar,
    Power,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/providers/language-provider";

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
    appearance_description?: string;
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
    file_name?: string;
    original_filename?: string;
    mime_type?: string;
    metadata?: Record<string, unknown>;
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

// Error Boundary to capture actual error details
class ProjectErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ProjectPage Error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
                    <h1 style={{ color: 'red' }}>⚠️ Project Page Error</h1>
                    <p><strong>Error:</strong> {this.state.error?.message}</p>
                    <pre style={{ background: '#f0f0f0', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                        {this.state.error?.stack}
                    </pre>
                    <button onClick={() => window.location.href = '/dashboard'} style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}>← Back to Dashboard</button>
                </div>
            );
        }
        return this.props.children;
    }
}

function ProjectDetailPageInner({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const supabase = createClient();
    const { language } = useLanguage();

    const [activeTab, setActiveTab] = useState("influencer");
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

    // Manual influencer creation state
    const [creationMode, setCreationMode] = useState<"ai" | "manual">("ai");
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [manualForm, setManualForm] = useState({
        name: "",
        gender: "female" as "male" | "female",
        personality: "",
        appearance_description: "",
        backstory: "",
    });

    // Product upload state
    const [isUploadingProduct, setIsUploadingProduct] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const productAssets = assets.filter((a) => a.asset_type === "custom");

    const [isGeneratingAdCopy, setIsGeneratingAdCopy] = useState(false);
    const [copiedAdId, setCopiedAdId] = useState<number | null>(null);

    // Social connections + publish state
    const [socialConnections, setSocialConnections] = useState<Array<{ id: string; platform: string; account_name: string; connected_at: string }>>([]);
    const [isPublishing, setIsPublishing] = useState<string | null>(null); // videoId being published
    const [publishPlatform, setPublishPlatform] = useState<string | null>(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishVideoId, setPublishVideoId] = useState<string | null>(null);
    const [publishVideoUrl, setPublishVideoUrl] = useState<string | null>(null);

    // Schedule state
    const [schedule, setSchedule] = useState<{ is_active: boolean; frequency: string; platforms: string[]; publish_times: string[] } | null>(null);
    const [scheduleFrequency, setScheduleFrequency] = useState("daily");
    const [scheduleTimes, setScheduleTimes] = useState(["10:00"]);
    const [schedulePlatforms, setSchedulePlatforms] = useState<string[]>([]);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);


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

            // Get social connections
            const connRes = await fetch('/api/social/connections');
            if (connRes.ok) {
                const connData = await connRes.json();
                setSocialConnections(connData.connections || []);
            }

            // Get schedule
            const schedRes = await fetch(`/api/social/schedule?projectId=${id}`);
            if (schedRes.ok) {
                const schedData = await schedRes.json();
                if (schedData.schedules?.[0]) {
                    const s = schedData.schedules[0];
                    setSchedule(s);
                    setScheduleFrequency(s.frequency || 'daily');
                    setScheduleTimes(Array.isArray(s.publish_times) ? s.publish_times : ['10:00']);
                    setSchedulePlatforms(s.platforms || []);
                }
            }

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

    // Auto-refresh video statuses when there are processing videos
    useEffect(() => {
        const hasProcessingVideos = videos.some(
            (v) => v.status !== 'ready' && v.status !== 'failed' && v.status !== 'script_ready'
        );
        if (!hasProcessingVideos) return;

        const pollInterval = setInterval(async () => {
            try {
                const { data: freshVideos } = await supabase
                    .from('videos')
                    .select('*')
                    .eq('project_id', id)
                    .order('created_at', { ascending: false });
                if (freshVideos) {
                    setVideos(freshVideos);
                }
            } catch (err) {
                console.error('[Poll] Video status refresh error:', err);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [videos, id, supabase]);

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
                body: JSON.stringify({ projectId: id, gender: selectedGender, language }),
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

    /* ─── Create Manual Influencer ─── */
    const handleCreateManualInfluencer = async () => {
        if (!manualForm.name.trim()) {
            setInfluencerError("Influencer adı zorunludur");
            return;
        }
        setIsSavingManual(true);
        setInfluencerError("");
        try {
            const { data, error: insertErr } = await supabase
                .from("ai_influencers")
                .insert({
                    project_id: id,
                    name: manualForm.name.trim(),
                    gender: manualForm.gender,
                    personality: manualForm.personality.trim() || null,
                    appearance_description: manualForm.appearance_description.trim() || null,
                    backstory: manualForm.backstory.trim() || null,
                    status: "ready",
                })
                .select()
                .single();

            if (insertErr) throw insertErr;
            setInfluencer(data);
            setManualForm({ name: "", gender: "female", personality: "", appearance_description: "", backstory: "" });
            setCreationMode("ai");
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Kaydetme hatası";
            setInfluencerError(errMsg);
        } finally {
            setIsSavingManual(false);
        }
    };

    /* ─── Product Upload ─── */
    const handleProductUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploadingProduct(true);
        setUploadProgress(0);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const ext = file.name.split(".").pop();
                const storagePath = `${id}/products/${Date.now()}-${file.name}`;

                setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));

                // Upload to Supabase Storage
                const { error: uploadErr } = await supabase.storage
                    .from("project-assets")
                    .upload(storagePath, file);
                if (uploadErr) throw uploadErr;

                // Save to assets table
                const { error: insertErr } = await supabase.from("assets").insert({
                    project_id: id,
                    asset_type: "custom",
                    file_name: file.name,
                    file_path: storagePath,
                    file_size: file.size,
                    mime_type: file.type,
                });
                if (insertErr) throw insertErr;

                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
            await fetchData();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Yükleme hatası";
            alert(`Ürün yükleme hatası: ${errMsg}`);
        } finally {
            setIsUploadingProduct(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteProduct = async (asset: AssetData) => {
        try {
            // Delete from storage
            await supabase.storage.from("project-assets").remove([asset.file_path]);
            // Delete from table
            await supabase.from("assets").delete().eq("id", asset.id);
            await fetchData();
        } catch (err) {
            alert("Silme hatası oluştu");
        }
    };

    /* ─── Generate Video ─── */
    const handleGenerateVideo = async (
        platform: "instagram" | "tiktok" | "youtube"
    ) => {
        setIsGenerating(true);
        setGeneratingPlatform(platform);
        setGenProgress(0);
        setGenStep("Video üretimi başlatılıyor...");
        setGenError("");

        // Progress animation while fal.ai works (video gen takes 2-5 min)
        const steps = [
            { progress: 10, label: "Video prompt hazırlanıyor..." },
            { progress: 25, label: "AI ile prompt güçlendiriliyor..." },
            { progress: 40, label: "fal.ai'ya gönderiliyor..." },
            { progress: 55, label: "Minimax Video render ediyor..." },
            { progress: 65, label: "Video oluşturuluyor..." },
            { progress: 75, label: "Render devam ediyor..." },
            { progress: 85, label: "Son dokunuşlar yapılıyor..." },
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
            // Build video prompt from project data + influencer + products
            let videoPrompt = `Create a ${platform} marketing video for "${project?.name || "product"}". ${project?.description || ""}. Value proposition: ${project?.value_proposition || "innovative solution"}`;

            // Add influencer context
            if (influencer) {
                videoPrompt += `\n\nInfluencer presenting: ${influencer.name}.`;
                if (influencer.personality) videoPrompt += ` Personality: ${influencer.personality}.`;
                if (influencer.backstory) videoPrompt += ` Background: ${influencer.backstory}.`;
                if (influencer.appearance_description) videoPrompt += ` Appearance: ${influencer.appearance_description}.`;
            }

            // Add product image context
            const productUrls = productAssets.map((a) => {
                const { data } = supabase.storage.from("project-assets").getPublicUrl(a.file_path);
                return data.publicUrl;
            });
            if (productUrls.length > 0) {
                videoPrompt += `\n\nProduct images available: ${productUrls.length} product photo(s). Feature these products prominently in the video.`;
            }

            const response = await fetch("/api/workflows/generate-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: id,
                    platform,
                    prompt: videoPrompt,
                    brandName: project?.name || "Brand",
                    title: `${project?.name || "Product"} - ${platform} Video`,
                    influencerId: influencer?.id || null,
                    influencerName: influencer?.name || null,
                    influencerPersonality: influencer?.personality || null,
                    influencerBackstory: influencer?.backstory || null,
                    productImageUrls: productUrls,
                    language,
                }),
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
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
            case "voicing":
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
                                setActiveTab("videos");
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
                                    value="settings"
                                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                                >
                                    <Settings className="w-4 h-4 mr-1.5" />
                                    Ayarlar
                                </TabsTrigger>

                            </TabsList>
                        </motion.div>




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
                                                        try {
                                                            setIsCreatingInfluencer(true);
                                                            setInfluencerStep("Mevcut influencer siliniyor...");

                                                            // Use Next.js API route (direct Supabase) instead of n8n webhook
                                                            const res = await fetch(`/api/influencer/${influencer.id}`, { method: 'DELETE' });
                                                            if (!res.ok) {
                                                                const errData = await res.json().catch(() => ({}));
                                                                throw new Error(errData.error || 'Silme işlemi başarısız');
                                                            }

                                                            // Clear influencer so the creation form (with gender selection) appears
                                                            setInfluencer(null);
                                                            setIsCreatingInfluencer(false);
                                                            setInfluencerStep("");
                                                            setInfluencerProgress(0);
                                                            setInfluencerError("");
                                                        } catch (err) {
                                                            console.error('Influencer deletion failed:', err);
                                                            const errMsg = err instanceof Error ? err.message : 'Bilinmeyen hata';
                                                            setInfluencerError(errMsg);
                                                            setInfluencerStep(`Hata: ${errMsg}`);
                                                            setIsCreatingInfluencer(false);
                                                            alert(`Influencer silme hatası: ${errMsg}`);
                                                        }
                                                    }}
                                                    className="w-full rounded-lg text-xs border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/30"
                                                >
                                                    {isCreatingInfluencer ? (
                                                        <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Siliniyor...</>
                                                    ) : (
                                                        <><RefreshCw className="w-3 h-3 mr-1.5" /> Yeniden Oluştur</>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-2xl border border-dashed border-border/50 text-center h-full flex flex-col items-center justify-center">
                                            <h3 className="font-medium mb-3">
                                                Influencer Oluştur
                                            </h3>

                                            {/* AI / Manuel Toggle */}
                                            <div className="flex gap-1 p-1 rounded-lg bg-muted/50 mb-4 w-full">
                                                <button
                                                    onClick={() => setCreationMode("ai")}
                                                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${creationMode === "ai" ? "bg-violet-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                                >
                                                    ✨ AI ile Oluştur
                                                </button>
                                                <button
                                                    onClick={() => setCreationMode("manual")}
                                                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${creationMode === "manual" ? "bg-violet-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                                >
                                                    ✏️ Manuel Oluştur
                                                </button>
                                            </div>

                                            {creationMode === "ai" ? (
                                                <>
                                                    <p className="text-xs text-muted-foreground mb-3">
                                                        Cinsiyet seçin, AI otomatik oluştursun
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
                                                        {isCreatingInfluencer ? "Oluşturuluyor..." : "AI Influencer Oluştur"}
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
                                                </>
                                            ) : (
                                                <div className="w-full space-y-3 text-left">
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">İsim *</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Örn: Ayşe Yıldız"
                                                            value={manualForm.name}
                                                            onChange={(e) => setManualForm(p => ({ ...p, name: e.target.value }))}
                                                            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                                                        />
                                                    </div>
                                                    {/* Gender */}
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Cinsiyet</label>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setManualForm(p => ({ ...p, gender: "female" }))}
                                                                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${manualForm.gender === "female" ? "border-violet-400 bg-violet-500/10 text-violet-600" : "border-border/50"}`}
                                                            >
                                                                👩 Kadın
                                                            </button>
                                                            <button
                                                                onClick={() => setManualForm(p => ({ ...p, gender: "male" }))}
                                                                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${manualForm.gender === "male" ? "border-violet-400 bg-violet-500/10 text-violet-600" : "border-border/50"}`}
                                                            >
                                                                👨 Erkek
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Kişilik</label>
                                                        <textarea
                                                            placeholder="Enerjik, samimi, güven veren..."
                                                            value={manualForm.personality}
                                                            onChange={(e) => setManualForm(p => ({ ...p, personality: e.target.value }))}
                                                            rows={2}
                                                            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Görünüş Tanımı</label>
                                                        <textarea
                                                            placeholder="30'lu yaşlarında, kahverengi saçlı..."
                                                            value={manualForm.appearance_description}
                                                            onChange={(e) => setManualForm(p => ({ ...p, appearance_description: e.target.value }))}
                                                            rows={2}
                                                            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Hikaye / Arka Plan</label>
                                                        <textarea
                                                            placeholder="Teknoloji tutkunu bir girişimci..."
                                                            value={manualForm.backstory}
                                                            onChange={(e) => setManualForm(p => ({ ...p, backstory: e.target.value }))}
                                                            rows={3}
                                                            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                                                        />
                                                    </div>
                                                    {influencerError && (
                                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" /> {influencerError}
                                                        </p>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={handleCreateManualInfluencer}
                                                        disabled={isSavingManual || !manualForm.name.trim()}
                                                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 border-0 text-xs"
                                                    >
                                                        {isSavingManual ? (
                                                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                        )}
                                                        {isSavingManual ? "Kaydediliyor..." : "Influencer Kaydet"}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                    className="lg:col-span-2 space-y-5"
                                >
                                    {/* Creation progress — full width card */}
                                    {!influencer && isCreatingInfluencer && (
                                        <div className="p-8 rounded-2xl border border-violet-300/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-semibold">AI Influencer Oluşturuluyor</h3>
                                                    <p className="text-xs text-muted-foreground">Bu işlem 15-30 saniye sürebilir</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm">
                                                    {influencerError ? (
                                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    ) : (
                                                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                                    )}
                                                    <span>{influencerStep || "Başlatılıyor..."}</span>
                                                </div>
                                                <Progress value={influencerProgress} className="h-2" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Influencer yok ise büyük oluşturma kartı */}
                                    {!influencer && !isCreatingInfluencer && (
                                        <div className="p-8 rounded-2xl border border-border/50 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                                            <h3 className="text-base font-semibold mb-2">Influencer Oluştur</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                                                AI ile otomatik veya manuel olarak kendi influencer&apos;ınızı oluşturun.
                                            </p>

                                            {/* AI / Manuel Toggle - Large */}
                                            <div className="flex gap-1 p-1 rounded-xl bg-muted/50 mb-6">
                                                <button
                                                    onClick={() => setCreationMode("ai")}
                                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${creationMode === "ai" ? "bg-violet-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                                                >
                                                    ✨ AI ile Otomatik Oluştur
                                                </button>
                                                <button
                                                    onClick={() => setCreationMode("manual")}
                                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${creationMode === "manual" ? "bg-violet-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                                                >
                                                    ✏️ Manuel Oluştur
                                                </button>
                                            </div>

                                            {creationMode === "ai" ? (
                                                <>
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
                                                </>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">İsim *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Örn: Ayşe Yıldız"
                                                                value={manualForm.name}
                                                                onChange={(e) => setManualForm(p => ({ ...p, name: e.target.value }))}
                                                                className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cinsiyet</label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setManualForm(p => ({ ...p, gender: "female" }))}
                                                                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${manualForm.gender === "female" ? "border-violet-400 bg-violet-500/10 text-violet-600" : "border-border/50"}`}
                                                                >
                                                                    👩 Kadın
                                                                </button>
                                                                <button
                                                                    onClick={() => setManualForm(p => ({ ...p, gender: "male" }))}
                                                                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${manualForm.gender === "male" ? "border-violet-400 bg-violet-500/10 text-violet-600" : "border-border/50"}`}
                                                                >
                                                                    👨 Erkek
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kişilik Özellikleri</label>
                                                        <textarea
                                                            placeholder="Enerjik, samimi, güven veren, profesyonel..."
                                                            value={manualForm.personality}
                                                            onChange={(e) => setManualForm(p => ({ ...p, personality: e.target.value }))}
                                                            rows={2}
                                                            className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Görünüş Tanımı</label>
                                                        <textarea
                                                            placeholder="30'lu yaşlarında, kahverengi saçlı, profesyonel giyimli..."
                                                            value={manualForm.appearance_description}
                                                            onChange={(e) => setManualForm(p => ({ ...p, appearance_description: e.target.value }))}
                                                            rows={2}
                                                            className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hikaye / Arka Plan</label>
                                                        <textarea
                                                            placeholder="Teknoloji tutkunu bir girişimci, 5 yıllık sektör deneyimi..."
                                                            value={manualForm.backstory}
                                                            onChange={(e) => setManualForm(p => ({ ...p, backstory: e.target.value }))}
                                                            rows={3}
                                                            className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                                                        />
                                                    </div>
                                                    {influencerError && (
                                                        <p className="text-sm text-red-500 flex items-center gap-1.5">
                                                            <AlertTriangle className="w-4 h-4" /> {influencerError}
                                                        </p>
                                                    )}
                                                    <Button
                                                        onClick={handleCreateManualInfluencer}
                                                        disabled={isSavingManual || !manualForm.name.trim()}
                                                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 border-0 shadow-lg shadow-emerald-500/20"
                                                    >
                                                        {isSavingManual ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        )}
                                                        {isSavingManual ? "Kaydediliyor..." : "Influencer Kaydet"}
                                                    </Button>
                                                </div>
                                            )}
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

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {(
                                                [
                                                    {
                                                        key: "instagram" as const,
                                                        label: "Instagram",
                                                        img: "/images/platforms/instagram.png",
                                                        desc: "Reels (10s)",
                                                    },
                                                    {
                                                        key: "tiktok" as const,
                                                        label: "TikTok",
                                                        img: "/images/platforms/tiktok.png",
                                                        desc: "Short (10s)",
                                                    },
                                                    {
                                                        key: "youtube" as const,
                                                        label: "YouTube",
                                                        img: "/images/platforms/youtube.png",
                                                        desc: "Shorts (10s)",
                                                    },
                                                ]
                                            ).map((platform) => (
                                                <button
                                                    key={platform.key}
                                                    onClick={() => handleGenerateVideo(platform.key)}
                                                    disabled={isGenerating}
                                                    className="group relative overflow-hidden rounded-xl border border-border/50 hover:border-violet-300/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <div className="relative w-full aspect-[4/3] overflow-hidden">
                                                        <Image
                                                            src={platform.img}
                                                            alt={platform.label}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            sizes="(max-width: 640px) 50vw, 25vw"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                                            <h4 className="text-sm font-semibold text-white drop-shadow-lg">
                                                                {platform.label}
                                                            </h4>
                                                            <p className="text-[11px] text-white/80">
                                                                {platform.desc}
                                                            </p>
                                                        </div>
                                                    </div>
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
                                                const res = await fetch(N8N_ENDPOINTS.adCopy, {
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
                                    className="py-8"
                                >
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                                            <Video className="w-8 h-8 text-violet-500" />
                                        </div>
                                        <h3 className="font-bold mb-2">Henüz Video Yok</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                            Platform seçin ve AI ilk videonuzu otomatik oluştursun
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                                        {([
                                            { key: "instagram" as const, label: "Instagram", img: "/images/platforms/instagram.png", desc: "Reels (10s)" },
                                            { key: "tiktok" as const, label: "TikTok", img: "/images/platforms/tiktok.png", desc: "Short (10s)" },
                                            { key: "youtube" as const, label: "YouTube", img: "/images/platforms/youtube.png", desc: "Shorts (10s)" },
                                        ]).map((platform) => (
                                            <button
                                                key={platform.key}
                                                onClick={() => handleGenerateVideo(platform.key)}
                                                disabled={isGenerating}
                                                className="group relative overflow-hidden rounded-xl border border-border/50 hover:border-violet-300/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="relative w-full aspect-[4/3] overflow-hidden">
                                                    <Image
                                                        src={platform.img}
                                                        alt={platform.label}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        sizes="(max-width: 640px) 50vw, 25vw"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                                        <h4 className="text-sm font-semibold text-white drop-shadow-lg">
                                                            {platform.label}
                                                        </h4>
                                                        <p className="text-[11px] text-white/80">
                                                            {platform.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <AnimatePresence>
                                        {isGenerating && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-5 p-4 rounded-xl bg-muted/30 space-y-3 max-w-2xl mx-auto"
                                            >
                                                <div className="flex items-center gap-2 text-sm">
                                                    {genError ? (
                                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    ) : (
                                                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                                    )}
                                                    <span className="capitalize">{generatingPlatform}</span> — {genStep}
                                                </div>
                                                <Progress value={genProgress} className="h-1.5" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                                                            className={`aspect-video relative flex items-center justify-center overflow-hidden ${!video.video_url ? `bg-gradient-to-br ${getPlatformColor(video.platform)}` : 'bg-black'}`}
                                                        >
                                                            {video.video_url && video.status === 'ready' && (
                                                                <video
                                                                    src={video.video_url}
                                                                    className="absolute inset-0 w-full h-full object-cover"
                                                                    muted
                                                                    playsInline
                                                                    preload="metadata"
                                                                    onMouseEnter={(e) => {
                                                                        const v = e.currentTarget;
                                                                        v.currentTime = 0;
                                                                        v.play().catch(() => { });
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        const v = e.currentTarget;
                                                                        v.pause();
                                                                        v.currentTime = 0;
                                                                    }}
                                                                />
                                                            )}
                                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
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
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation()
                                                                        try {
                                                                            const { error } = await supabase
                                                                                .from('videos')
                                                                                .delete()
                                                                                .eq('id', video.id)
                                                                            if (!error) {
                                                                                setVideos(prev => prev.filter(v => v.id !== video.id))
                                                                            } else {
                                                                                console.error('Video delete error:', error)
                                                                                alert('Video silinemedi. Lütfen tekrar deneyin.')
                                                                            }
                                                                        } catch (err) {
                                                                            console.error('Video delete error:', err)
                                                                            alert('Video silme hatası. Lütfen tekrar deneyin.')
                                                                        }
                                                                    }}
                                                                    className="w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center transition-opacity hover:bg-red-500/80"
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
                                                                        className="flex-1 h-8 text-xs rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 text-white border-0"
                                                                        onClick={() => {
                                                                            if (video.video_url) {
                                                                                const a = document.createElement('a');
                                                                                a.href = video.video_url;
                                                                                a.download = `${video.title || 'video'}.mp4`;
                                                                                a.target = '_blank';
                                                                                document.body.appendChild(a);
                                                                                a.click();
                                                                                document.body.removeChild(a);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Download className="w-3 h-3 mr-1" />
                                                                        Videoyu İndir
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
                                                                AI video oluşturuyor. Bu işlem 1-3 dakika sürebilir.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/30 p-4">
                                                            <p className="text-xs text-blue-600 flex items-center gap-2">
                                                                <Sparkles className="w-4 h-4" />
                                                                Script ve ses üretimi tamamlandı. Video render edildikten sonra burada izleyebileceksiniz.
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

                        {/* ═══ SETTINGS TAB ═══ */}
                        <TabsContent value="settings" className="space-y-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                                {/* Manual Publishing Guide */}
                                <div className="p-6 rounded-2xl border border-border/50 bg-background/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                                        <Download className="w-4 h-4 text-violet-500" />
                                        Videoları Nasıl Yayınlarım?
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-5">
                                        AI ile ürettiğiniz videoları indirip sosyal medya hesaplarınızdan kolayca paylaşabilirsiniz.
                                    </p>

                                    <div className="space-y-4">
                                        {[
                                            { step: '1', title: 'Videoyu İndirin', desc: 'Videolar sekmesindeki İndir butonuna tıklayarak MP4 dosyasını telefonunuza veya bilgisayarınıza kaydedin.', icon: '📥' },
                                            { step: '2', title: 'Bilgileri Kopyalayın', desc: 'Video detaylarına tıklayarak başlık, açıklama, hashtag ve script bilgilerini kopyalayın.', icon: '📋' },
                                            { step: '3', title: 'Paylaşın', desc: 'Videoyu Instagram Reels, TikTok, YouTube Shorts veya X üzerinden paylaşırken kopyaladığınız bilgileri yapıştırın.', icon: '🚀' },
                                        ].map(({ step, title, desc, icon }) => (
                                            <div key={step} className="flex gap-4 items-start">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-200/30 dark:border-violet-800/30 flex items-center justify-center text-lg flex-shrink-0">
                                                    {icon}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{title}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Platform Tips */}
                                <div className="p-6 rounded-2xl border border-border/50 bg-background/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                                        <Share2 className="w-4 h-4 text-violet-500" />
                                        Platform İpuçları
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { platform: 'Instagram Reels', tip: "Dikey 9:16 format, 60 saniyeye kadar, hashtag'leri açıklamaya ekleyin", color: 'from-purple-500 to-pink-500', emoji: '📸' },
                                            { platform: 'TikTok', tip: 'Dikey 9:16 format, 60 saniyeye kadar, trending sesleri kullanın', color: 'from-gray-800 to-gray-900', emoji: '🎵' },
                                            { platform: 'YouTube Shorts', tip: 'Dikey 9:16 format, 60 saniyeye kadar, #Shorts ekleyin', color: 'from-red-600 to-red-700', emoji: '▶️' },
                                            { platform: 'X (Twitter)', tip: "2 dk 20 sn'ye kadar, açıklamayı tweet olarak yazın", color: 'from-sky-500 to-sky-600', emoji: '𝕏' },
                                        ].map(({ platform, tip, emoji }) => (
                                            <div key={platform} className="p-3 rounded-xl bg-muted/30 border border-border/30">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm">{emoji}</span>
                                                    <span className="text-xs font-semibold">{platform}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </motion.div >
                        </TabsContent >


                    </Tabs >



                </motion.div >
            </main >
        </div >
    );
}

export default function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
    return (
        <ProjectErrorBoundary>
            <ProjectDetailPageInner {...props} />
        </ProjectErrorBoundary>
    );
}
