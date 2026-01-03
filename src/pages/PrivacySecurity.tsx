import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Shield, Lock, Eye, FileText, Cookie, UserCheck } from 'lucide-react';

export default function PrivacySecurity() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <div className="flex items-center gap-4 px-4 py-4 max-w-4xl mx-auto">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Legal</p>
                        <h1 className="font-serif text-lg font-semibold">Privacy & Security</h1>
                    </div>
                </div>
            </header>

            <main className="p-4 lg:p-6 max-w-4xl mx-auto pb-12">
                {/* Introduction */}
                <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
                    <div className="flex gap-4">
                        <Shield className="h-12 w-12 text-primary shrink-0" />
                        <div>
                            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                                Your Privacy Matters
                            </h2>
                            <p className="text-muted-foreground">
                                We are committed to protecting your personal information and being transparent about
                                how we collect, use, and safeguard your data. This page outlines our privacy
                                practices and security measures.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Privacy Policy */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="h-6 w-6 text-primary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">Privacy Policy</h2>
                    </div>
                    <Card className="p-6 space-y-4">
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">Effective Date</h3>
                            <p className="text-sm text-muted-foreground">
                                Last updated: January 2026
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">Our Commitment</h3>
                            <p className="text-sm text-muted-foreground">
                                This Privacy Policy describes how we collect, use, and protect your personal
                                information when you use our meditation and therapy learning platform. By using our
                                services, you agree to the collection and use of information in accordance with this
                                policy.
                            </p>
                        </div>
                    </Card>
                </section>

                {/* Data Collection */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Eye className="h-6 w-6 text-primary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">
                            Information We Collect
                        </h2>
                    </div>
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li>Name and email address</li>
                                    <li>Profile information and preferences</li>
                                    <li>Payment and billing information</li>
                                    <li>Communication history with support</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Usage Data</h3>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li>Course enrollment and progress</li>
                                    <li>Lesson completion and time spent</li>
                                    <li>Audio playback activity</li>
                                    <li>Device and browser information</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Technical Data</h3>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li>IP address and location data</li>
                                    <li>Session information and timestamps</li>
                                    <li>Performance and error logs</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Data Usage */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <UserCheck className="h-6 w-6 text-primary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">How We Use Your Data</h2>
                    </div>
                    <Card className="p-6">
                        <ul className="text-sm text-muted-foreground space-y-3">
                            <li className="flex gap-2">
                                <span className="text-primary shrink-0">•</span>
                                <span>
                                    <strong className="text-foreground">Service Delivery:</strong> To provide,
                                    maintain, and improve our platform and courses
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary shrink-0">•</span>
                                <span>
                                    <strong className="text-foreground">Personalization:</strong> To customize your
                                    learning experience and recommend relevant content
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary shrink-0">•</span>
                                <span>
                                    <strong className="text-foreground">Communication:</strong> To send important
                                    updates, notifications, and support responses
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary shrink-0">•</span>
                                <span>
                                    <strong className="text-foreground">Analytics:</strong> To analyze usage patterns
                                    and improve our services
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary shrink-0">•</span>
                                <span>
                                    <strong className="text-foreground">Security:</strong> To protect against fraud,
                                    abuse, and unauthorized access
                                </span>
                            </li>
                        </ul>
                    </Card>
                </section>

                {/* Security Measures */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Lock className="h-6 w-6 text-primary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">Security Measures</h2>
                    </div>
                    <Card className="p-6">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                We implement industry-standard security measures to protect your personal information:
                            </p>
                            <div className="grid gap-4">
                                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                                    <Shield className="h-5 w-5 text-success shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground">Encryption</h3>
                                        <p className="text-xs text-muted-foreground">
                                            All data transmission is encrypted using SSL/TLS protocols
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                                    <Shield className="h-5 w-5 text-success shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground">Secure Storage</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Data is stored in secure, encrypted databases with restricted access
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                                    <Shield className="h-5 w-5 text-success shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground">Access Control</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Strict authentication and authorization controls limit data access
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                                    <Shield className="h-5 w-5 text-success shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground">Regular Audits</h3>
                                        <p className="text-xs text-muted-foreground">
                                            We conduct regular security assessments and vulnerability scans
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* User Rights */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <UserCheck className="h-6 w-6 text-primary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">Your Rights</h2>
                    </div>
                    <Card className="p-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            You have the following rights regarding your personal data:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
                            <li>Access and review your personal information</li>
                            <li>Request corrections to inaccurate data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Export your personal data in a portable format</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Withdraw consent for data processing</li>
                        </ul>
                        <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                To exercise any of these rights, please contact our support team.
                            </p>
                        </div>
                    </Card>
                </section>

                {/* Cookies */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Cookie className="h-6 w-6 text-primary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">Cookies & Tracking</h2>
                    </div>
                    <Card className="p-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            We use cookies and similar technologies to enhance your experience:
                        </p>
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Essential Cookies</h3>
                                <p className="text-xs text-muted-foreground">
                                    Required for authentication, security, and core platform functionality
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Performance Cookies</h3>
                                <p className="text-xs text-muted-foreground">
                                    Help us understand how visitors use our platform to improve performance
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Preference Cookies</h3>
                                <p className="text-xs text-muted-foreground">
                                    Remember your settings and preferences for a personalized experience
                                </p>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Contact */}
                <Card className="p-6 bg-muted/50">
                    <h2 className="font-serif text-lg font-semibold text-foreground mb-2">
                        Questions or Concerns?
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        If you have any questions about our privacy practices or want to exercise your rights,
                        please don't hesitate to contact us.
                    </p>
                    <Button variant="therapy" onClick={() => navigate('/help')}>
                        Contact Support
                    </Button>
                </Card>
            </main>
        </div>
    );
}
