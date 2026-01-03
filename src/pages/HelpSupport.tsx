import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ChevronLeft,
    HelpCircle,
    MessageSquare,
    BookOpen,
    Headphones,
    CreditCard,
    Smartphone,
    Wifi,
    Mail,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

const faqs = [
    {
        category: 'Account Management',
        icon: <BookOpen className="h-5 w-5" />,
        questions: [
            {
                q: 'How do I reset my password?',
                a: 'Click the "Forgot Password" link on the login page. Enter your email address and we will send you a password reset link.',
            },
            {
                q: 'Can I change my email address?',
                a: 'Yes, go to your profile settings and update your email address. You will receive a confirmation email to verify the change.',
            },
            {
                q: 'How do I delete my account?',
                a: 'Contact our support team to request account deletion. Please note this action is irreversible and all your data will be permanently removed.',
            },
        ],
    },
    {
        category: 'Course Access',
        icon: <Headphones className="h-5 w-5" />,
        questions: [
            {
                q: 'How do I enroll in a course?',
                a: 'Browse the available courses, select one you are interested in, and click "Enroll Now". For paid courses, you will need to complete the payment process first.',
            },
            {
                q: 'Can I access courses offline?',
                a: 'Currently, courses require an internet connection. We recommend using a stable WiFi connection for the best experience.',
            },
            {
                q: 'Why is a lesson locked?',
                a: 'Lessons are unlocked sequentially. You must complete the previous lesson before accessing the next one. This ensures a proper learning progression.',
            },
        ],
    },
    {
        category: 'Audio Playback',
        icon: <Headphones className="h-5 w-5" />,
        questions: [
            {
                q: 'Why is the audio not playing?',
                a: 'Check your internet connection and ensure your device volume is turned up. Try refreshing the page. If the issue persists, contact support.',
            },
            {
                q: 'Can I pause the audio?',
                a: 'Yes, you have a limited number of pauses per lesson. The remaining pauses are shown during playback. Contact admin if you need additional pauses.',
            },
            {
                q: 'Can I skip forward or backward in the audio?',
                a: 'Seeking is disabled to ensure you listen to the full content in the intended sequence for optimal therapeutic benefit.',
            },
        ],
    },
    {
        category: 'Payments',
        icon: <CreditCard className="h-5 w-5" />,
        questions: [
            {
                q: 'What payment methods do you accept?',
                a: 'We accept major credit cards, debit cards, and digital payment methods. All transactions are secure and encrypted.',
            },
            {
                q: 'Is my payment information secure?',
                a: 'Yes, we use industry-standard encryption and do not store your complete payment details. All transactions are processed through secure payment gateways.',
            },
            {
                q: 'Can I get a refund?',
                a: 'Refund policies vary by course. Please check the specific course details or contact support for refund requests within the eligible period.',
            },
        ],
    },
    {
        category: 'Technical Issues',
        icon: <Smartphone className="h-5 w-5" />,
        questions: [
            {
                q: 'What browsers are supported?',
                a: 'We support the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, keep your browser updated.',
            },
            {
                q: 'The page is loading slowly. What should I do?',
                a: 'Check your internet connection speed. Clear your browser cache and cookies. Try using a different browser or device.',
            },
            {
                q: 'I am getting an error message. What should I do?',
                a: 'Take a screenshot of the error message and contact our support team. Include details about what you were doing when the error occurred.',
            },
        ],
    },
];

export default function HelpSupport() {
    const navigate = useNavigate();
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const toggleFaq = (id: string) => {
        setExpandedFaq(expandedFaq === id ? null : id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement contact form submission
        alert('Thank you for contacting us! We will get back to you soon.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <div className="flex items-center gap-4 px-4 py-4 max-w-4xl mx-auto">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Support</p>
                        <h1 className="font-serif text-lg font-semibold">Help & Support</h1>
                    </div>
                </div>
            </header>

            <main className="p-4 lg:p-6 max-w-4xl mx-auto pb-12">
                {/* Introduction */}
                <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
                    <div className="flex gap-4">
                        <HelpCircle className="h-12 w-12 text-primary shrink-0" />
                        <div>
                            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                                How Can We Help?
                            </h2>
                            <p className="text-muted-foreground">
                                Find answers to common questions, troubleshooting guides, and ways to contact our
                                support team. We're here to ensure you have the best learning experience.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* FAQ Section */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((category, catIndex) => (
                            <Card key={catIndex} className="overflow-hidden">
                                <div className="p-4 bg-muted/50 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        {category.icon}
                                        <h3 className="font-semibold text-foreground">{category.category}</h3>
                                    </div>
                                </div>
                                <div className="divide-y divide-border">
                                    {category.questions.map((item, qIndex) => {
                                        const faqId = `${catIndex}-${qIndex}`;
                                        const isExpanded = expandedFaq === faqId;
                                        return (
                                            <div key={qIndex}>
                                                <button
                                                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors flex items-center justify-between gap-2"
                                                    onClick={() => toggleFaq(faqId)}
                                                >
                                                    <span className="font-medium text-foreground text-sm">{item.q}</span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    )}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-4 pb-4 text-sm text-muted-foreground bg-muted/20">
                                                        {item.a}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* System Requirements */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Smartphone className="h-6 w-6 text-primary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">System Requirements</h2>
                    </div>
                    <Card className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-primary" />
                                    Supported Devices
                                </h3>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                                    <li>Desktop computers (Windows, Mac, Linux)</li>
                                    <li>Laptops</li>
                                    <li>Tablets (iOS, Android)</li>
                                    <li>Smartphones (iOS, Android)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Wifi className="h-4 w-4 text-primary" />
                                    Internet Connection
                                </h3>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                                    <li>Minimum: 5 Mbps download speed</li>
                                    <li>Recommended: 10+ Mbps for best quality</li>
                                    <li>Stable connection required for audio streaming</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    Supported Browsers
                                </h3>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                                    <li>Google Chrome (latest version)</li>
                                    <li>Mozilla Firefox (latest version)</li>
                                    <li>Safari (latest version)</li>
                                    <li>Microsoft Edge (latest version)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Headphones className="h-4 w-4 text-primary" />
                                    Audio Requirements
                                </h3>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                                    <li>Working speakers or headphones</li>
                                    <li>Updated audio drivers</li>
                                    <li>Browser audio permissions enabled</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Contact Support */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <MessageSquare className="h-6 w-6 text-primary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">Contact Support</h2>
                    </div>
                    <Card className="p-6">
                        <p className="text-sm text-muted-foreground mb-6">
                            Can't find what you're looking for? Send us a message and our support team will get
                            back to you as soon as possible.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        required
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        required
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                    required
                                    placeholder="Brief description of your issue"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    required
                                    placeholder="Describe your issue or question in detail..."
                                    rows={6}
                                />
                            </div>
                            <Button type="submit" variant="therapy" className="w-full md:w-auto">
                                <Mail className="h-4 w-4 mr-2" />
                                Send Message
                            </Button>
                        </form>
                    </Card>
                </section>
            </main>
        </div>
    );
}
