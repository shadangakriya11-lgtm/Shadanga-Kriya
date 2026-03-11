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
import { shouldShowPaymentFeatures } from '@/lib/platformDetection';

const faqs = [
    {
        category: 'Account Management',
        icon: <BookOpen className="h-5 w-5" />,
        questions: [
            {
                q: 'How do I update my profile information?',
                a: 'Go to your Profile page from the bottom navigation. You can update your name, email address, phone number, and other personal details.',
            },
            {
                q: 'How do I delete my account?',
                a: 'Go to your Profile page and scroll to the bottom. Click "Delete Account" and follow the confirmation steps. Please note this action is irreversible and all your data will be permanently removed.',
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
        category: 'Technical Issues',
        icon: <Smartphone className="h-5 w-5" />,
        questions: [
            {
                q: 'The app is not working properly on my iPhone/iPad. What should I do?',
                a: 'First, make sure you have the latest version of the app from the App Store. Try closing and reopening the app. If issues persist, restart your device. Check that you have a stable internet connection and sufficient storage space.',
            },
            {
                q: 'Audio is not playing on my iOS device. How do I fix this?',
                a: 'Check that your device is not in silent mode (check the side switch). Ensure the volume is turned up. Try using headphones to test if the issue is with the speaker. Close other apps that might be using audio. If the problem continues, restart your device.',
            },
            {
                q: 'The page is loading slowly. What should I do?',
                a: 'Check your internet connection speed. We recommend a minimum of 5 Mbps for smooth streaming. Try switching between WiFi and mobile data. Close other apps running in the background. Clear the app cache by closing and reopening it.',
            },
            {
                q: 'I am getting an error message. What should I do?',
                a: 'Take a screenshot of the error message and contact our support team. Include details about what you were doing when the error occurred, your device model, and operating system version.',
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/support/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            alert('Thank you for contacting us! We will get back to you soon.');
            setContactForm({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error('Error submitting contact form:', error);
            alert(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
        }
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
                        {faqs.filter(category => {
                            // Hide Payments and Course Access categories on iOS
                            if (!shouldShowPaymentFeatures() && 
                                (category.category === 'Payments' || category.category === 'Course Access')) {
                                return false;
                            }
                            return true;
                        }).map((category, catIndex) => (
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
