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
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Globe,
    title: "Proje Analizi",
    description:
      "URL girin, AI projenizi derinlemesine analiz etsin. Değer önerisi, hedef kitle ve rakip analizi otomatik yapılır.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "AI Influencer Oluşturma",
    description:
      "Markanıza özel, tutarlı bir AI Influencer karakteri oluşturulur. Her videoda aynı yüz ve ses konuşur.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Video,
    title: "Video Üretimi",
    description:
      "Instagram, TikTok ve LinkedIn için otomatik olarak platformasına özgü videolar üretilir.",
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
  },
  {
    number: "02",
    title: "AI Analiz Eder",
    description: "Sistem projenizi analiz eder ve Pazarlama Anayasası oluşturur",
  },
  {
    number: "03",
    title: "Influencer Oluşur",
    description: "Markanıza özel bir AI Influencer karakteri yaratılır",
  },
  {
    number: "04",
    title: "Video Yayınlanır",
    description: "Tüm platformlar için profesyonel videolar üretilir ve yayınlanır",
  },
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
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">
              AI Marketing <span className="gradient-text">Factory</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0"
            >
              <Link href="/dashboard">Başla</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center grid-bg">
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15),transparent_70%)]" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-sm">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-muted-foreground">
                Otonom AI Pazarlama Motoru
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Projeniz İçin
              <br />
              <span className="gradient-text">AI Influencer</span>
              <br />
              Oluşturun
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Herhangi bir web projesini analiz edin, ona özel bir AI Influencer
              yaratın ve tüm sosyal medya platformları için{" "}
              <span className="text-foreground font-medium">
                profesyonel videolar
              </span>{" "}
              tamamen otonom üretin.
            </p>

            {/* URL Input */}
            <div className="max-w-xl mx-auto mb-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
                <div className="relative flex gap-2 p-2 glass rounded-xl">
                  <Input
                    type="url"
                    placeholder="https://myresumefit.ai"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-lg h-12 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                  />
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 px-6 h-12"
                  >
                    <Link
                      href={
                        url
                          ? `/dashboard?url=${encodeURIComponent(url)}`
                          : "/dashboard"
                      }
                    >
                      Analiz Et
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground/60">
              Herhangi bir URL girin — web sitesi, SaaS, e-ticaret, uygulama...
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Nasıl <span className="gradient-text">Çalışır</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tamamen otonom bir AI pazarlama motoru. Sadece URL'nizi girin,
              gerisini biz halledelim.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="group relative h-full p-6 rounded-2xl glass hover:bg-white/[0.08] transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
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
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(124,58,237,0.1),transparent_70%)]" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              4 Adımda <span className="gradient-text">Viral Video</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group flex items-center gap-8 p-6 rounded-2xl glass hover:bg-white/[0.08] transition-all duration-300"
              >
                <div className="text-4xl font-bold gradient-text opacity-60 group-hover:opacity-100 transition-opacity min-w-[60px]">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                <ChevronRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative p-12 rounded-3xl glass overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-pink-500/10" />
            <div className="relative z-10">
              <BarChart3 className="w-12 h-12 text-violet-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pazarlamanızı{" "}
                <span className="gradient-text">Otomatikleştirin</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                AI Marketing Factory ile haftalar süren içerik üretimini
                dakikalara indirin.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0 text-lg px-8 h-14"
              >
                <Link href="/dashboard">
                  Hemen Başla
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium">AI Marketing Factory</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 AI Marketing Factory. Powered by Abacus.AI & ElevenLabs
          </p>
        </div>
      </footer>
    </div>
  );
}
