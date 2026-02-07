import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Wind, Moon, Heart, Sparkles } from "lucide-react";

interface OnboardingSlide {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }> | null;
    image?: string;
    gradient: string;
    bgGradient: string;
    showLogo?: boolean;
}

const slides: OnboardingSlide[] = [
    {
        id: 1,
        title: "Welcome to",
        subtitle: "Shadanga Kriya",
        description: "Begin your journey to inner peace with guided audio meditation sessions",
        icon: null,
        showLogo: true,
        gradient: "from-teal-400 to-cyan-500",
        bgGradient: "from-teal-500/10 via-cyan-500/5 to-transparent",
    },
    {
        id: 2,
        title: "Breathe",
        subtitle: "& Relax",
        description: "Practice ancient pranayama techniques with soothing audio guidance for deep relaxation",
        icon: null,
        image: "/slide2.png",
        gradient: "from-cyan-400 to-blue-500",
        bgGradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
    },
    {
        id: 3,
        title: "Find Your",
        subtitle: "Inner Peace",
        description: "Experience profound calm and mental clarity through daily meditation practice",
        icon: null,
        image: "/slide3.png",
        gradient: "from-indigo-400 to-purple-500",
        bgGradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
    },
    {
        id: 4,
        title: "Transform",
        subtitle: "Your Life",
        description: "Join thousands who have discovered lasting peace, focus, and emotional balance",
        icon: null,
        image: "/slide4.png",
        gradient: "from-rose-400 to-pink-500",
        bgGradient: "from-rose-500/10 via-pink-500/5 to-transparent",
    },
];

export function NativeOnboarding() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    // Reset and start auto-advance timer
    const resetAutoPlayTimer = useCallback(() => {
        if (autoPlayTimerRef.current) {
            clearInterval(autoPlayTimerRef.current);
        }
        autoPlayTimerRef.current = setInterval(() => {
            nextSlide();
        }, 4000);
    }, [nextSlide]);

    // Auto-advance slides - always running
    useEffect(() => {
        resetAutoPlayTimer();
        return () => {
            if (autoPlayTimerRef.current) {
                clearInterval(autoPlayTimerRef.current);
            }
        };
    }, [resetAutoPlayTimer]);

    // Touch handlers for swipe
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
            resetAutoPlayTimer(); // Reset timer after manual swipe
        } else if (isRightSwipe) {
            prevSlide();
            resetAutoPlayTimer(); // Reset timer after manual swipe
        }
    };

    const handleNavClick = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            prevSlide();
        } else {
            nextSlide();
        }
        resetAutoPlayTimer(); // Reset timer after manual click
    };

    const handleDotClick = (index: number) => {
        goToSlide(index);
        resetAutoPlayTimer(); // Reset timer after manual click
    };

    const slide = slides[currentSlide];
    const IconComponent = slide.icon;

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-hidden">
            {/* Main Content Area with swipe */}
            <div
                className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Background gradient */}
                <div
                    className={`absolute inset-0 bg-gradient-to-b ${slide.bgGradient} transition-all duration-700`}
                />

                {/* Floating orbs for ambient effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className={`absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br ${slide.gradient} blur-3xl opacity-20 animate-float-slow`}
                        style={{ animationDelay: '0s' }}
                    />
                    <div
                        className={`absolute bottom-40 right-10 w-40 h-40 rounded-full bg-gradient-to-br ${slide.gradient} blur-3xl opacity-15 animate-float-slow`}
                        style={{ animationDelay: '1s' }}
                    />
                </div>

                {/* Slide Content */}
                <div className="relative z-10 text-center max-w-sm mx-auto" key={currentSlide}>
                    {/* Visual Element - Logo, Image, or Icon with breathing animation */}
                    <div className="relative mb-8 flex items-center justify-center animate-fade-in">
                        {/* Breathing rings */}
                        <div className="absolute w-44 h-44 rounded-full border-2 border-primary/20 animate-breathe" />
                        <div className="absolute w-52 h-52 rounded-full border border-primary/10 animate-breathe" style={{ animationDelay: '0.5s' }} />
                        <div className="absolute w-60 h-60 rounded-full border border-primary/5 animate-breathe" style={{ animationDelay: '1s' }} />

                        {/* Glow effect */}
                        <div className={`absolute w-36 h-36 rounded-full bg-gradient-to-br ${slide.gradient} blur-2xl opacity-30`} />

                        {/* Logo, Image, or Icon */}
                        {slide.showLogo ? (
                            <div className="relative animate-float-slow">
                                <img
                                    src="/shadanga-kriya-logo.png"
                                    alt="Shadanga Kriya"
                                    className="w-36 h-36 object-contain drop-shadow-xl"
                                />
                            </div>
                        ) : slide.image ? (
                            <div className="relative animate-float-slow">
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="w-40 h-40 object-contain drop-shadow-xl rounded-full"
                                />
                            </div>
                        ) : IconComponent ? (
                            <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-xl animate-float-slow`}>
                                <IconComponent className="h-14 w-14 text-white" />
                            </div>
                        ) : null}
                    </div>

                    {/* Text content */}
                    <h1 className="font-serif text-3xl font-bold text-foreground mb-1 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {slide.title}
                    </h1>
                    <h2 className={`font-serif text-4xl font-bold bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent mb-6 animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
                        {slide.subtitle}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-base px-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        {slide.description}
                    </p>
                </div>

                {/* Navigation Arrows (for manual control) */}
                <button
                    onClick={() => handleNavClick('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/50 backdrop-blur-sm border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                    onClick={() => handleNavClick('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/50 backdrop-blur-sm border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Next slide"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Bottom Section - Fixed */}
            <div className="px-6 pb-8 pt-4 relative z-10">
                {/* Slide indicators */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-8 bg-primary'
                                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <Button
                        size="lg"
                        className="brand-button-primary text-white w-full h-14 text-base rounded-xl font-semibold shadow-lg"
                        onClick={() => navigate("/auth?mode=signup")}
                    >
                        Start Meditating
                        <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="w-full h-12 text-base rounded-xl text-muted-foreground hover:text-foreground"
                        onClick={() => navigate("/auth")}
                    >
                        Already have an account? Sign In
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default NativeOnboarding;
