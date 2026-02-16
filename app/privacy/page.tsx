import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | CreatorPersonaAI",
    description: "How CreatorPersonaAI collects, uses, and protects your data.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border/30 bg-muted/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
                    <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-semibold">Privacy Policy</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="prose prose-invert prose-sm max-w-none space-y-8">
                    <div>
                        <p className="text-muted-foreground text-sm">Last updated: February 15, 2026</p>
                    </div>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            CreatorPersonaAI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy and is committed to
                            protecting your personal data. This Privacy Policy explains how we collect, use, store, and share
                            your information when you use our AI influencer and video generation platform.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">2. Data We Collect</h2>

                        <h3 className="text-lg font-semibold text-foreground mt-4">2.1 Account Data</h3>
                        <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Email address (for authentication)</li>
                            <li>Account preferences and settings</li>
                            <li>Subscription and billing information (processed via Stripe)</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-foreground mt-4">2.2 Content Data</h3>
                        <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                            <li>AI influencer profiles you create (name, personality, appearance descriptions)</li>
                            <li>Video generation prompts and scripts</li>
                            <li>Generated images and videos (stored temporarily)</li>
                            <li>Reference photos used for AI generation</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-foreground mt-4">2.3 Usage Data</h3>
                        <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Page views and feature usage (via Google Analytics)</li>
                            <li>Browser type, device information, IP address</li>
                            <li>Session duration and interaction patterns</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">3. How We Use Your Data</h2>
                        <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                            <li>To provide and maintain the Service</li>
                            <li>To process AI content generation requests</li>
                            <li>To manage subscriptions and payments</li>
                            <li>To improve our AI models and user experience</li>
                            <li>To send important service-related communications</li>
                            <li>To comply with legal obligations</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">4. Third-Party Services</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use the following third-party services that may process your data:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-muted-foreground border border-border/30 rounded-lg">
                                <thead>
                                    <tr className="border-b border-border/30 bg-muted/20">
                                        <th className="text-left p-3 font-semibold text-foreground">Service</th>
                                        <th className="text-left p-3 font-semibold text-foreground">Purpose</th>
                                        <th className="text-left p-3 font-semibold text-foreground">Data Shared</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border/20">
                                        <td className="p-3">Supabase</td>
                                        <td className="p-3">Database & Authentication</td>
                                        <td className="p-3">Account data, content data</td>
                                    </tr>
                                    <tr className="border-b border-border/20">
                                        <td className="p-3">fal.ai</td>
                                        <td className="p-3">AI Image Generation</td>
                                        <td className="p-3">Text prompts, reference images</td>
                                    </tr>
                                    <tr className="border-b border-border/20">
                                        <td className="p-3">OpenRouter</td>
                                        <td className="p-3">AI Text Generation</td>
                                        <td className="p-3">Text prompts</td>
                                    </tr>
                                    <tr className="border-b border-border/20">
                                        <td className="p-3">Kling AI</td>
                                        <td className="p-3">AI Video Generation</td>
                                        <td className="p-3">Images, text prompts</td>
                                    </tr>
                                    <tr className="border-b border-border/20">
                                        <td className="p-3">ElevenLabs</td>
                                        <td className="p-3">AI Voice Generation</td>
                                        <td className="p-3">Text scripts</td>
                                    </tr>
                                    <tr className="border-b border-border/20">
                                        <td className="p-3">Stripe</td>
                                        <td className="p-3">Payment Processing</td>
                                        <td className="p-3">Billing information</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Google Analytics</td>
                                        <td className="p-3">Usage Analytics</td>
                                        <td className="p-3">Anonymized usage data</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">5. Cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use essential cookies for authentication and session management. We also use
                            Google Analytics cookies to understand how visitors interact with our platform.
                            You can control cookie preferences through your browser settings or our cookie consent banner.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">6. Data Retention</h2>
                        <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                            <li><strong>Account data:</strong> Retained until account deletion</li>
                            <li><strong>Generated content:</strong> Retained for 90 days after generation, unless saved by user</li>
                            <li><strong>Usage logs:</strong> Retained for 12 months</li>
                            <li><strong>Payment records:</strong> Retained as required by tax and financial regulations</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">7. Your Rights (GDPR)</h2>
                        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
                            <p className="text-violet-200 font-medium mb-2">Under GDPR, you have the right to:</p>
                            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                                <li><strong>Access</strong> — Request a copy of your personal data</li>
                                <li><strong>Rectification</strong> — Correct inaccurate personal data</li>
                                <li><strong>Erasure</strong> — Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
                                <li><strong>Restrict Processing</strong> — Limit how we process your data</li>
                                <li><strong>Data Portability</strong> — Receive your data in a structured, machine-readable format</li>
                                <li><strong>Object</strong> — Object to processing of your personal data</li>
                                <li><strong>Withdraw Consent</strong> — Withdraw consent at any time where processing is based on consent</li>
                            </ul>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            To exercise any of these rights, contact us at{" "}
                            <a href="mailto:privacy@creatorpersonaai.com" className="text-violet-400 hover:underline">
                                privacy@creatorpersonaai.com
                            </a>
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">8. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement industry-standard security measures including encryption in transit (TLS/SSL),
                            secure authentication, and access controls to protect your personal data. However, no method
                            of electronic storage is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">9. Children&apos;s Privacy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service is not intended for individuals under the age of 18. We do not knowingly collect
                            personal data from children. If we become aware that a child has provided us with personal data,
                            we will take steps to delete such information.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-foreground">10. Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For privacy-related inquiries, please contact:{" "}
                            <a href="mailto:privacy@creatorpersonaai.com" className="text-violet-400 hover:underline">
                                privacy@creatorpersonaai.com
                            </a>
                        </p>
                    </section>
                </div>

                {/* Footer links */}
                <div className="mt-16 pt-8 border-t border-border/30 flex items-center gap-6 text-sm text-muted-foreground">
                    <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
                    <Link href="/ai-disclosure" className="hover:text-foreground transition-colors">AI Disclosure</Link>
                    <Link href="/" className="hover:text-foreground transition-colors">Back to Home</Link>
                </div>
            </main>
        </div>
    );
}
