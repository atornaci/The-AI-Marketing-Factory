"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Video,
  Zap,
  Globe,
  ArrowRight,
  Bot,
  BarChart3,
  Share2,
  ChevronRight,
  Instagram,
  PlayCircle,
  Wand2,
  Target,
  TrendingUp,
  Layers,
  Eye,
} from "lucide-react";
import Link from "next/link";

/* ─── Squiggle SVG underline component ─── */
const SquiggleUnderline = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 418 42"
    className="absolute -bottom-2 left-0 w-full h-[0.6em]"
    preserveAspectRatio="none"
  >
    <path
      d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6.089-12.56-5.527l-1.07.064z"
      fill="currentColor"
      className="text-violet-500"
    />
  </svg>
);

/* ─── Highlighted Title component ─── */
const HighlightedTitle = ({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) => {
  const parts = text.split(/~/);
  return (
    <h2
      className={`text-4xl md:text-6xl font-bold tracking-tight ${className}`}
    >
      {parts.map((part, index) =>
        index === 1 ? (
          <span key={index} className="relative whitespace-nowrap">
            <span className="relative gradient-text">{part}</span>
            <SquiggleUnderline />
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </h2>
  );
};

/* ─── Animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as const },
  },
};

/* ─── Data ─── */
const integrations = [
  {
    icon: Instagram,
    name: "Instagram",
    description: "Reels ve hikayeler otomatik yayınlanır",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Video,
    name: "TikTok",
    description: "Viral TikTok videoları oluşturulur",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: PlayCircle,
    name: "YouTube",
    description: "Shorts ve video içerikler üretilir",
    color: "from-red-500 to-rose-600",
  },
  {
    icon: Share2,
    name: "LinkedIn",
    description: "Profesyonel paylaşımlar yapılır",
    color: "from-blue-600 to-indigo-600",
  },
  {
    icon: Wand2,
    name: "Abacus.AI",
    description: "Akıllı içerik analizi ve senaryo yazımı",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Bot,
    name: "ElevenLabs",
    description: "Doğal sesli anlatım üretimi",
    color: "from-emerald-500 to-teal-500",
  },
];

const features = [
  {
    icon: Globe,
    title: "Proje Analizi",
    description:
      "URL girin, AI projenizi analiz etsin. Değer önerisi, hedef kitle ve rakip analizi otomatik yapılır.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "AI Influencer",
    description:
      "Markanıza özel, tutarlı bir AI Influencer karakteri — her videoda aynı yüz ve ses.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Video,
    title: "Video Üretimi",
    description:
      "Instagram, TikTok, YouTube ve LinkedIn için platforma özgü videolar üretilir.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Share2,
    title: "Otonom Dağıtım",
    description:
      "Hazırlanan videolar otomatik olarak sosyal medya platformlarına yayınlanır.",
    gradient: "from-orange-500 to-amber-500",
  },
];

const steps = [
  {
    number: "01",
    title: "URL Girin",
    description: "Pazarlamak istediğiniz web projesinin URL'sini girin",
    icon: Target,
  },
  {
    number: "02",
    title: "AI Analiz Eder",
    description:
      "Sistem projenizi analiz eder ve Pazarlama Anayasası oluşturur",
    icon: Eye,
  },
  {
    number: "03",
    title: "Influencer Oluşur",
    description: "Markanıza özel bir AI Influencer karakteri yaratılır",
    icon: Wand2,
  },
  {
    number: "04",
    title: "Video Yayınlanır",
    description:
      "Tüm platformlar için profesyonel videolar üretilir ve yayınlanır",
    icon: TrendingUp,
  },
];

const stats = [
  { value: "10x", label: "Daha Hızlı İçerik" },
  { value: "4+", label: "Platform Desteği" },
  { value: "AI", label: "Otonom Motor" },
  { value: "∞", label: "Ölçeklenebilir" },
];

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              AI Marketing <span className="gradient-text">Factory</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 shadow-lg shadow-violet-500/25"
            >
              <Link href="/auth">Başla</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ══════════════ Hero Section ══════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08),transparent_70%)]" />
        <div className="absolute inset-0 grid-bg opacity-50" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/6 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-background/50 backdrop-blur-sm text-sm">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-muted-foreground">
                  Otonom AI Pazarlama Motoru
                </span>
              </div>
            </motion.div>

            {/* Title with squiggle */}
            <motion.div variants={itemVariants} className="mb-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
                Projeniz İçin
                <br />
                <span className="relative whitespace-nowrap">
                  <span className="relative gradient-text">AI Influencer</span>
                  <SquiggleUnderline />
                </span>
                <br />
                Oluşturun
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Herhangi bir web projesini analiz edin, ona özel bir AI Influencer
              yaratın ve tüm sosyal medya platformları için{" "}
              <span className="text-foreground font-semibold">
                profesyonel videolar
              </span>{" "}
              tamamen otonom üretin.
            </motion.p>

            {/* URL Input */}
            <motion.div variants={itemVariants} className="max-w-xl mx-auto mb-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                <div className="relative flex gap-2 p-2 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-sm">
                  <Input
                    type="url"
                    placeholder="https://yourproject.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-lg h-12 focus-visible:ring-0 placeholder:text-muted-foreground/40"
                  />
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 px-6 h-12 rounded-xl shadow-lg shadow-violet-500/25"
                  >
                    <Link
                      href={
                        url
                          ? `/dashboard?url=${encodeURIComponent(url)}`
                          : "/auth"
                      }
                    >
                      Analiz Et
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-sm text-muted-foreground/50"
            >
              Herhangi bir URL girin — web sitesi, SaaS, e-ticaret, uygulama...
            </motion.p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </section>

      {/* ══════════════ Stats Strip ══════════════ */}
      <section className="py-12 border-y border-border/30">
        <motion.div
          className="max-w-5xl mx-auto px-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════ Features Section ══════════════ */}
      <section className="py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <HighlightedTitle
                text="Nasıl ~Çalışır~?"
                className="mb-4"
              />
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Tamamen otonom bir AI pazarlama motoru. Sadece URL&apos;nizi
                girin, gerisini biz halledelim.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <motion.div key={feature.title} variants={itemVariants}>
                  <div className="group relative h-full p-6 rounded-2xl border border-border/50 bg-background/50 hover:bg-muted/50 hover:border-violet-500/30 transition-all duration-300 cursor-pointer">
                    <div className="relative z-10">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}
                      >
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ Integration Showcase ══════════════ */}
      <section className="py-28 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.06),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            {/* Header */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16"
            >
              <div>
                <HighlightedTitle
                  text="Tüm ~Platformlarla~ Entegre"
                  className="mb-4 text-left"
                />
                <p className="text-muted-foreground text-lg">
                  Popüler sosyal medya platformlarına ve AI servislerine
                  doğrudan bağlanın. İçerikleriniz tam otomatik yayınlansın.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <motion.div
                  className="relative w-48 h-48"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 blur-2xl" />
                  <div className="relative w-full h-full rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                    <Layers className="w-20 h-20 text-violet-400/60" />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Integration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map((item) => (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 hover:border-violet-500/30 transition-all duration-300"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{item.name}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ Steps Section ══════════════ */}
      <section className="py-28 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(124,58,237,0.06),transparent_70%)]" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <HighlightedTitle
                text="4 Adımda ~Viral Video~"
                className="mb-4"
              />
            </motion.div>

            <div className="space-y-4">
              {steps.map((step) => (
                <motion.div
                  key={step.number}
                  variants={itemVariants}
                  className="group flex items-center gap-6 md:gap-8 p-5 md:p-6 rounded-2xl border border-border/50 bg-background/50 hover:bg-muted/50 hover:border-violet-500/30 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-violet-500/20 group-hover:to-purple-500/20 transition-colors">
                    <step.icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-violet-400/70">
                        {step.number}
                      </span>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </div>
                  <ChevronRight className="flex-shrink-0 w-5 h-5 text-muted-foreground/40 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ CTA Section ══════════════ */}
      <section className="py-28 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="relative p-12 md:p-16 rounded-3xl border border-border/50 bg-background/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/3 to-pink-500/5" />

            {/* Decorative corner orbs */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

            <motion.div variants={itemVariants} className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-7 h-7 text-violet-400" />
              </div>
              <HighlightedTitle
                text="Pazarlamanızı ~Otomatikleştirin~"
                className="text-3xl md:text-4xl mb-4"
              />
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                AI Marketing Factory ile haftalar süren içerik üretimini
                dakikalara indirin.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 text-lg px-8 h-14 rounded-xl shadow-lg shadow-violet-500/25"
              >
                <Link href="/auth">
                  Hemen Başla
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ Footer ══════════════ */}
      <footer className="py-12 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">AI Marketing Factory</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 AI Marketing Factory. Powered by Abacus.AI &amp; ElevenLabs
          </p>
        </div>
      </footer>
    </div>
  );
}
