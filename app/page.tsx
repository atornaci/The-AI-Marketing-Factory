"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Video,
  Zap,
  ArrowRight,
  Bot,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Shield,
  Users,
  Wand2,
  FileText,
  Clapperboard,
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
const steps = [
  {
    icon: Bot,
    title: "Create Your AI Influencer",
    description:
      "Pick a gender, choose an industry, and AI creates a unique influencer with a photorealistic avatar, custom personality, and backstory.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: FileText,
    title: "Write Your Script",
    description:
      "Tell your influencer what to say. Write any length — AI automatically adapts it to fit a 10-second video format.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Clapperboard,
    title: "Generate Video",
    description:
      "Pick a platform, click generate, and Kling AI produces a 10-second video with your influencer speaking your script with lip-sync.",
    gradient: "from-pink-500 to-rose-500",
  },
];

const platforms = [
  { name: "TikTok", desc: "Viral Short Videos", color: "from-cyan-400 to-teal-500", emoji: "🎵" },
  { name: "Instagram", desc: "Reels & Stories", color: "from-pink-500 to-rose-500", emoji: "📸" },
  { name: "YouTube", desc: "Shorts & Clips", color: "from-red-500 to-red-600", emoji: "▶️" },
  { name: "LinkedIn", desc: "Professional Content", color: "from-blue-600 to-blue-700", emoji: "💼" },
];

const trustedBy = [
  { name: "Kling AI", desc: "Cinematic Video Production" },
  { name: "OpenRouter", desc: "Smart AI Engine" },
  { name: "fal.ai", desc: "Avatar Generation" },
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ═══ NAVBAR ═══ */}
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
              Vid<span className="gradient-text">Forge</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="#pricing">
              <Button variant="ghost" size="sm" className="text-sm">
                Pricing
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white rounded-xl text-sm px-5 shadow-lg shadow-violet-500/25"
              >
                Get Started
                <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HERO SECTION ═══ */}
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
                <span className="text-muted-foreground">AI-Powered Video Marketing</span>
                <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Create AI Influencers,
              <br />
              <span className="relative whitespace-nowrap">
                <span className="relative gradient-text">Generate Videos</span>
                <SquiggleUnderline />
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Build your AI influencer, write a script, and generate a 10-second marketing video
              with lip-sync for TikTok, Instagram, YouTube & LinkedIn.{" "}
              <strong className="text-foreground">All in one place.</strong>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
            >
              <Link href="/auth">
                <Button className="h-14 px-10 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-base font-semibold shadow-xl shadow-violet-500/25 transition-all hover:shadow-2xl hover:shadow-violet-500/30 w-full sm:w-auto">
                  <Wand2 className="mr-2 w-5 h-5" />
                  Create Your Influencer
                </Button>
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.p
              variants={itemVariants}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60"
            >
              <Shield className="w-4 h-4" />
              Free to start · No credit card required
            </motion.p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "3 Steps", label: "To Your First Video", icon: Zap },
                { value: "4+", label: "Platform Support", icon: Video },
                { value: "AI", label: "Generated Avatars", icon: Bot },
              ].map((s) => (
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

      {/* ═══ POWERED BY ═══ */}
      <AnimatedSection className="py-12 border-y border-border/30 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-8">
            <p className="text-sm text-muted-foreground/60 uppercase tracking-widest font-medium">
              Powered By Leading AI Technology
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

      {/* ═══ HOW IT WORKS ═══ */}
      <AnimatedSection className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-background/50 text-xs mb-4">
              <PlayCircle className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-muted-foreground">Simple 3-step process</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
              How It{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative gradient-text">Works</span>
                <SquiggleUnderline />
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From influencer creation to professional video — everything happens on one page.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="group relative p-8 rounded-2xl border border-border/40 bg-background/60 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
              >
                {/* Step number connector */}
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {i + 1}
                  </div>
                </div>
                <div className="mt-4 mb-5">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ PLATFORM SUPPORT ═══ */}
      <AnimatedSection className="py-24 lg:py-32 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
              One Video, Every{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative gradient-text">Platform</span>
                <SquiggleUnderline />
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Create videos optimized for each platform&apos;s format, audience, and trends.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((p) => (
              <motion.div
                key={p.name}
                variants={itemVariants}
                className="group p-6 rounded-2xl border border-border/40 bg-background/60 hover:border-violet-500/30 transition-all duration-300 text-center"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <span className="text-2xl">{p.emoji}</span>
                </div>
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ FEATURES HIGHLIGHT ═══ */}
      <AnimatedSection className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
              Why{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative gradient-text">VidForge</span>
                <SquiggleUnderline />
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: "AI-Generated Avatars",
                desc: "Photorealistic AI avatars generated from your character description. Unique, consistent, and brand-aligned.",
              },
              {
                icon: Video,
                title: "10-Second AI Videos",
                desc: "Powered by Kling AI — your influencer speaks your script with realistic lip-sync in a 10-second video.",
              },
              {
                icon: Users,
                title: "Influencer Library",
                desc: "Build and manage multiple AI influencers. Each with their own look, personality, and backstory.",
              },
              {
                icon: FileText,
                title: "Script Adaptation",
                desc: "Write any length script — AI automatically condenses it to fit a 10-second video while preserving your message.",
              },
              {
                icon: Zap,
                title: "Reusable Influencers",
                desc: "Create an influencer once, use them for unlimited videos. Change the script each time for fresh content.",
              },
              {
                icon: Wand2,
                title: "All-in-One Dashboard",
                desc: "Create influencers, write scripts, generate videos, and manage your library — all from a single page.",
              },
            ].map((f) => (
              <motion.div
                key={f.title}
                variants={itemVariants}
                className="p-6 rounded-2xl border border-border/40 bg-background/60 hover:border-violet-500/20 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-violet-500" />
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ PRICING SECTION ═══ */}
      <AnimatedSection className="py-24 lg:py-32 bg-muted/20" >
        <div id="pricing" className="max-w-7xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-background/50 text-xs mb-4">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-muted-foreground">Simple, transparent pricing</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
              Choose Your{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative gradient-text">Plan</span>
                <SquiggleUnderline />
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start free, upgrade as you grow. Every plan includes AI-generated captions and hashtags.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <motion.div
              variants={itemVariants}
              className="relative p-8 rounded-2xl border border-border/40 bg-background/60 hover:border-violet-500/20 transition-all flex flex-col"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Free</h3>
                <p className="text-sm text-muted-foreground">Try it out</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "1 AI Influencer",
                  "2 videos / month",
                  "TikTok platform",
                  "Post caption & hashtags",
                  "Watermarked videos",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth" className="w-full">
                <Button variant="outline" className="w-full rounded-xl h-12 font-semibold">
                  Get Started Free
                </Button>
              </Link>
            </motion.div>

            {/* Starter — Highlighted */}
            <motion.div
              variants={itemVariants}
              className="relative p-8 rounded-2xl border-2 border-violet-500/50 bg-background/80 shadow-xl shadow-violet-500/10 flex flex-col"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-bold shadow-lg">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Starter</h3>
                <p className="text-sm text-muted-foreground">For content creators</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$39</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "5 AI Influencers",
                  "10 videos / month",
                  "All platforms (TikTok, IG, YT, LinkedIn)",
                  "Post caption & hashtags",
                  "No watermark",
                  "Custom scripts",
                  "Priority generation",
                  "Extra videos at $3.50/each",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth?plan=starter" className="w-full">
                <Button className="w-full rounded-xl h-12 font-semibold bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white shadow-lg shadow-violet-500/25">
                  Start Creating
                  <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Creator */}
            <motion.div
              variants={itemVariants}
              className="relative p-8 rounded-2xl border border-border/40 bg-background/60 hover:border-violet-500/20 transition-all flex flex-col"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Creator</h3>
                <p className="text-sm text-muted-foreground">For teams & agencies</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Unlimited AI Influencers",
                  "30 videos / month",
                  "All platforms",
                  "Post caption & hashtags",
                  "No watermark",
                  "Custom scripts",
                  "Priority generation",
                  "HD export",
                  "Video history & library",
                  "Extra videos at $3/each",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth?plan=creator" className="w-full">
                <Button variant="outline" className="w-full rounded-xl h-12 font-semibold border-violet-500/30 hover:bg-violet-500/5">
                  Start Creating
                  <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ═══ CTA SECTION ═══ */}
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
                Start Creating Now
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
                Your First AI Video Awaits
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                Create your AI influencer and generate a professional marketing video in minutes. No experience needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="h-14 px-10 rounded-2xl bg-white text-violet-700 hover:bg-white/90 text-base font-bold shadow-xl"
                  >
                    <Wand2 className="mr-2 w-5 h-5" />
                    Create Your Influencer
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Free to start
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready in minutes
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/30 bg-muted/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">
                Vid<span className="gradient-text">Forge</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/auth" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/auth" className="hover:text-foreground transition-colors">
                Get Started
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} VidForge. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
