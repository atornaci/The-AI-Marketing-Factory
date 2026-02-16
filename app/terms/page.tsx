import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | CreatorPersonaAI",
    description: "Terms and conditions for using CreatorPersonaAI platform.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border/30 bg-muted/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
                    <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-semibold">Terms of Service</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="prose prose-invert prose-sm max-w-none space-y-8">
                    <div>
                        <p className="text-muted-foreground text-sm">Last updated: February 15, 2026</p>
                    </div>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using CreatorPersonaAI (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use the Service.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">2. Description of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            CreatorPersonaAI is an AI-powered platform that enables users to create virtual AI influencer personas
                            and generate marketing videos. All content produced by the Service — including but not limited to images,
                            videos, text, and audio — is generated using artificial intelligence models.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">3. AI-Generated Content — User Responsibility</h2>
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                            <p className="text-amber-200 leading-relaxed font-medium">
                                ⚠️ All content generated through CreatorPersonaAI is AI-generated. You are solely responsible for:
                            </p>
                            <ul className="text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                                <li>Reviewing all AI-generated content before publishing or sharing</li>
                                <li>Ensuring content complies with applicable laws and platform guidelines</li>
                                <li>Clearly disclosing that content is AI-generated when publishing on social media</li>
                                <li>Any damages or claims arising from your use of AI-generated content</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">4. Prohibited Uses</h2>
                        <p className="text-muted-foreground leading-relaxed">You agree NOT to use the Service to:</p>
                        <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                            <li><strong className="text-red-400">Create deepfakes</strong> — Impersonating real individuals without their explicit written consent</li>
                            <li><strong className="text-red-400">Generate fake news</strong> — Creating misleading content presented as factual journalism</li>
                            <li><strong className="text-red-400">Produce illegal content</strong> — Including but not limited to defamatory, hateful, or sexually explicit material</li>
                            <li><strong className="text-red-400">Deceive or mislead</strong> — Presenting AI-generated personas as real people without disclosure</li>
                            <li><strong className="text-red-400">Infringe on rights</strong> — Violating intellectual property, privacy, or publicity rights of others</li>
                            <li><strong className="text-red-400">Harass or harm</strong> — Creating content intended to harass, threaten, or harm individuals</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">5. Intellectual Property & Content Ownership</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Content generated through the Service is created using AI models. While you retain rights to use the
                            generated content for your intended purposes, you acknowledge that:
                        </p>
                        <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                            <li>AI-generated content may not be eligible for copyright protection in all jurisdictions</li>
                            <li>Similar content may be generated for other users due to the nature of AI models</li>
                            <li>CreatorPersonaAI retains the right to use anonymized data to improve the Service</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">6. Account & Subscription</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You are responsible for maintaining the confidentiality of your account credentials.
                            Subscription plans are billed as specified at the time of purchase. Refunds are handled
                            according to our refund policy. We reserve the right to suspend or terminate accounts
                            that violate these terms.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">7. Third-Party Services</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service integrates with third-party AI providers (fal.ai, OpenRouter, Kling AI, ElevenLabs)
                            and infrastructure services (Supabase, Stripe). Your use of the Service is also subject to the
                            terms and conditions of these third-party providers.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">8. Disclaimer of Warranties</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that
                            AI-generated content will be accurate, appropriate, or free from errors. AI models may
                            produce unexpected or inappropriate results. You use the Service at your own risk.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">9. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To the maximum extent permitted by law, CreatorPersonaAI shall not be liable for any indirect,
                            incidental, special, consequential, or punitive damages arising from your use of the Service or
                            any AI-generated content.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">10. Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to modify these terms at any time. Continued use of the Service after
                            changes constitutes acceptance of the updated terms. We will notify users of material changes
                            via email or in-app notification.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">11. Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For questions about these Terms, please contact us at{" "}
                            <a href="mailto:legal@creatorpersonaai.com" className="text-violet-400 hover:underline">
                                legal@creatorpersonaai.com
                            </a>
                        </p>
                    </section>
                </div>

                {/* Footer links */}
                <div className="mt-16 pt-8 border-t border-border/30 flex items-center gap-6 text-sm text-muted-foreground">
                    <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                    <Link href="/ai-disclosure" className="hover:text-foreground transition-colors">AI Disclosure</Link>
                    <Link href="/" className="hover:text-foreground transition-colors">Back to Home</Link>
                </div>
            </main>
        </div>
    );
}
