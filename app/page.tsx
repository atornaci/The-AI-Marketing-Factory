"use client";

import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Video,
  Zap,
  Globe,
  ArrowRight,
  Bot,
  Share2,
  ChevronRight,
  PlayCircle,
  Target,
  TrendingUp,
  Star,
  CheckCircle2,
  Shield,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  Quote,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

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
const stats = [
  { value: "90%", label: "Cost Savings", icon: DollarSign },
  { value: "10x", label: "Faster Content", icon: Zap },
  { value: "4+", label: "Platform Support", icon: Globe },
  { value: "24/7", label: "Autonomous Operation", icon: Clock },
];

const features = [
  {
    icon: Target,
    title: "Enter URL, AI Analyzes",
    description:
      "Enter your website URL and get your project analyzed in 30 seconds. Value proposition, target audience, and competitor analysis ready.",
    benefit: "Instant results instead of manual analysis",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "Create AI Influencer",
    description:
      "Create a custom AI character for your brand — same face, same voice, same identity in every video.",
    benefit: "Brand face without influencer costs",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Video,
    title: "Produce Professional Videos",
    description:
      "Platform-specific professional videos for Instagram, TikTok, YouTube, and LinkedIn are automatically produced.",
    benefit: "No video team required",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Share2,
    title: "Auto Distribution",
    description:
      "Generated videos are automatically published across all social media platforms. Just sit back and watch.",
    benefit: "Save time and effort",
    gradient: "from-orange-500 to-amber-500",
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Founder, TechStart",
    avatar: "SM",
    content:
      "We cut our video content costs by 90%. We used to pay $3,000 per video, now we produce professional videos with AI in minutes.",
    stat: "90% cost reduction",
    stars: 5,
  },
  {
    name: "James Wilson",
    role: "Digital Marketing Director",
    avatar: "JW",
    content:
      "We reduced the 20 hours per week we spent on social media content production down to 2 hours. The AI Influencer feature also improved our brand consistency.",
    stat: "10x time savings",
    stars: 5,
  },
  {
    name: "Emily Chen",
    role: "E-commerce Entrepreneur",
    avatar: "EC",
    content:
      "We're a small team but we can produce videos at the quality level of big brands. Publishing on 4 platforms simultaneously is incredible.",
    stat: "4 platforms, one click",
    stars: 5,
  },
];

const integrations = [
  { name: "Instagram", desc: "Reels & Stories", color: "from-pink-500 to-rose-500" },
  { name: "TikTok", desc: "Viral Videos", color: "from-cyan-400 to-teal-500" },
  { name: "YouTube", desc: "Shorts & Video", color: "from-red-500 to-red-600" },
  { name: "LinkedIn", desc: "Professional Content", color: "from-blue-600 to-blue-700" },
];

const trustedBy = [
  { name: "OpenRouter", desc: "Smart Content Engine" },
  { name: "ElevenLabs", desc: "Natural Voice Generation" },
  { name: "Kling AI", desc: "Cinematic Video Production" },
];

/* ─── Section wrapper with useInView ─── */
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Main Component ─── */
export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ═══════════════════════════════════════════ */}
      {/* NAVBAR                                      */}
      {/* ═══════════════════════════════════════════ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              AI Marketing <span className="gradient-text">Factory</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white rounded-xl text-sm px-5 shadow-lg shadow-violet-500/25"
              >
                Try Free
                <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION                                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.08),transparent_60%)]" />
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 text-sm">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-muted-foreground">The World&apos;s First Autonomous AI Marketing Engine</span>
                <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Fully Automate Your
              <br />
              <span className="relative whitespace-nowrap">
                <span className="relative gradient-text">Video Marketing</span>
                <SquiggleUnderline />
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Enter your URL → Let AI analyze → Professional videos produced for 4 platforms.
              <br />
              <strong className="text-foreground">No team needed, no agency required, in minutes.</strong>
            </motion.p>

            {/* URL Input + CTA */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6"
            >
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                <Input
                  type="url"
                  placeholder="https://yourproject.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-12 h-14 rounded-2xl text-base border-border/50 bg-background/80 backdrop-blur-sm focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <Link href={url ? `/auth?url=${encodeURIComponent(url)}` : "/dashboard"}>
                <Button className="h-14 px-8 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-base font-semibold shadow-xl shadow-violet-500/25 transition-all hover:shadow-2xl hover:shadow-violet-500/30 w-full sm:w-auto">
                  Try Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.p
              variants={itemVariants}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60"
            >
              <Shield className="w-4 h-4" />
              No credit card required · Start in 30 seconds
            </motion.p>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center p-5 rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm hover:border-violet-500/30 transition-colors"
                >
                  <s.icon className="w-5 h-5 text-violet-500 mb-2" />
                  <div className="text-2xl font-bold gradient-text">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* POWERED BY / TRUST LOGOS                    */}
      {/* ═══════════════════════════════════════════ */}
      <AnimatedSection className="py-12 border-y border-border/30 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-8">
            <p className="text-sm text-muted-foreground/60 uppercase tracking-widest font-medium">
              Powered By Leading Technology
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {trustedBy.map((t) => (
              <div key={t.name} className="flex items-center gap-3 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground/70">{t.name}</div>
                  <div className="text-xs">{t.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════ */}
      {/* HOW IT WORKS — Result-Oriented              */}
      {/* ═══════════════════════════════════════════ */}
      <AnimatedSection className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-background/50 text-xs mb-4">
              <PlayCircle className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-muted-foreground">Just 3 steps</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
              How It{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative gradient-text">Works</span>
                <SquiggleUnderline />
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A fully autonomous AI marketing engine. Enter your URL, we handle the rest.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={itemVariants}
                className="group relative p-6 rounded-2xl border border-border/40 bg-background/60 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
              >
                <div className="mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-xs font-bold text-muted-foreground/40 mb-2">
                  STEP {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {f.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-violet-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {f.benefit}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════ */}
      {/* PLATFORM SUPPORT                            */}
      {/* ═══════════════════════════════════════════ */}
      <AnimatedSection className="py-24 lg:py-32 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
              Integrated With All{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative gradient-text">Platforms</span>
                <SquiggleUnderline />
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Videos automatically produced to match each platform's format, size, and trends.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {integrations.map((int) => (
              <motion.div
                key={int.name}
                variants={itemVariants}
                className="group p-6 rounded-2xl border border-border/40 bg-background/60 hover:border-violet-500/30 transition-all duration-300 text-center"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${int.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Video className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">{int.name}</h3>
                <p className="text-sm text-muted-foreground">{int.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════ */}
      {/* TESTIMONIALS                                */}
      {/* ═══════════════════════════════════════════ */}
      <AnimatedSection className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-background/50 text-xs mb-4">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-muted-foreground">User Reviews</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
              What Our Users{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative gradient-text">Are Saying</span>
                <SquiggleUnderline />
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={itemVariants}
                className="relative p-6 rounded-2xl border border-border/40 bg-background/60 hover:border-violet-500/20 transition-all"
              >
                <Quote className="w-8 h-8 text-violet-500/20 mb-4" />
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  &ldquo;{t.content}&rdquo;
                </p>
                {/* Stat badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-semibold mb-4">
                  <TrendingUp className="w-3 h-3" />
                  {t.stat}
                </div>
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA SECTION                                 */}
      {/* ═══════════════════════════════════════════ */}
      <AnimatedSection className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 p-12 lg:p-16 text-center text-white"
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-sm mb-8">
                <Zap className="w-4 h-4" />
                Start Now
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
                Produce Your First Video Now
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                No credit card required. Sign up in 30 seconds, enter your URL and
                watch the AI magic.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="h-14 px-10 rounded-2xl bg-white text-violet-700 hover:bg-white/90 text-base font-bold shadow-xl"
                  >
                    Try Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Instant setup
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER                                      */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="border-t border-border/30 bg-muted/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">
                AI Marketing <span className="gradient-text">Factory</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} AI Marketing Factory. All rights reserved.
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-8 border-t border-border/20">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
              <Shield className="w-3.5 h-3.5" />
              SSL Protected
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
              <Globe className="w-3.5 h-3.5" />
              GDPR Compliant
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
              <BarChart3 className="w-3.5 h-3.5" />
              Powered by Vercel
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
