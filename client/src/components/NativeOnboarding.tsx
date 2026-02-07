import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
    features?: string[];
}

const slides: OnboardingSlide[] = [
    {
        id: 1,
        title: "Welcome to",
        subtitle: "Shadanga Kriya",
        description: "A 6-part guided audio meditation practice combining ancient pranayama wisdom with modern audio therapy for deep transformation",
        icon: null,
        showLogo: true,
        gradient: "from-teal-400 to-cyan-500",
        bgGradient: "from-teal-500/10 via-cyan-500/5 to-transparent",
        features: ["6 Kriya Practices", "Audio Guided", "Daily Sessions"],
    },
    {
        id: 2,
        title: "Breathe",
        subtitle: "& Relax",
        description: "Master pranayama breathing techniques with soothing audio guidance. Release tension and discover deep states of relaxation",
        icon: null,
        image: "/slide2.png",
        gradient: "from-cyan-400 to-blue-500",
        bgGradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
        features: ["Pranayama", "Stress Relief", "Better Sleep"],
    },
    {
        id: 3,
        title: "Find Your",
        subtitle: "Inner Peace",
        description: "Experience profound calm and mental clarity. Develop focus, reduce anxiety, and cultivate a peaceful mind through daily practice",
        icon: null,
        image: "/slide3.png",
        gradient: "from-indigo-400 to-purple-500",
        bgGradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
        features: ["Mental Clarity", "Focus", "Calm Mind"],
    },
    {
        id: 4,
        title: "Transform",
        subtitle: "Your Life",
        description: "Join practitioners who have discovered lasting peace, emotional balance, and enhanced well-being through daily practice",
        icon: null,
        image: "/slide4.png",
        gradient: "from-rose-400 to-pink-500",
        bgGradient: "from-rose-500/10 via-pink-500/5 to-transparent",
        features: ["Life Changing", "Daily Practice", "Inner Growth"],
    },
];

export function NativeOnboarding() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const SLIDE_DURATION = 5000;
    const PROGRESS_INTERVAL = 50;
    const minSwipeDistance = 50;

    const nextSlide = useCallback(() => {
        setSlideDirection('left');
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setProgress(0);
    }, []);

    const prevSlide = useCallback(() => {
        setSlideDirection('right');
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setProgress(0);
    }, []);

    const goToSlide = (index: number) => {
        setSlideDirection(index > currentSlide ? 'left' : 'right');
        setCurrentSlide(index);
        setProgress(0);
    };

    const resetAutoPlayTimer = useCallback(() => {
        if (autoPlayTimerRef.current) {
            clearInterval(autoPlayTimerRef.current);
        }
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
        }

        setProgress(0);

        progressTimerRef.current = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (100 / (SLIDE_DURATION / PROGRESS_INTERVAL));
                return newProgress >= 100 ? 100 : newProgress;
            });
        }, PROGRESS_INTERVAL);

        autoPlayTimerRef.current = setInterval(() => {
            nextSlide();
        }, SLIDE_DURATION);
    }, [nextSlide]);

    useEffect(() => {
        resetAutoPlayTimer();
        // Mark first load complete after initial render
        const timer = setTimeout(() => setIsFirstLoad(false), 800);
        return () => {
            if (autoPlayTimerRef.current) {
                clearInterval(autoPlayTimerRef.current);
            }
            if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current);
            }
            clearTimeout(timer);
        };
    }, [resetAutoPlayTimer]);

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
            resetAutoPlayTimer();
        } else if (isRightSwipe) {
            prevSlide();
            resetAutoPlayTimer();
        }
    };

    const handleDotClick = (index: number) => {
        goToSlide(index);
        resetAutoPlayTimer();
    };

    const slide = slides[currentSlide];
    const IconComponent = slide.icon;

    // Animation class based on direction
    const getSlideAnimationClass = () => {
        if (isFirstLoad && currentSlide === 0) {
            return 'animate-fade-in';
        }
        if (slideDirection === 'left') {
            return 'animate-slide-in-right';
        }
        if (slideDirection === 'right') {
            return 'animate-slide-in-left';
        }
        return '';
    };

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-hidden">
            {/* Inline styles for slide animations */}
            <style>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.4s ease-out forwards;
                }
                .animate-slide-in-left {
                    animation: slideInLeft 0.4s ease-out forwards;
                }
                .animate-fade-in-initial {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>

            {/* Top Progress Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1.5 p-3 safe-area-top">
                {slides.map((_, index) => (
                    <div key={index} className="flex-1 h-1 rounded-full bg-muted-foreground/20 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ease-linear ${index < currentSlide
                                    ? 'w-full bg-primary'
                                    : index === currentSlide
                                        ? 'bg-primary'
                                        : 'w-0'
                                }`}
                            style={{
                                width: index === currentSlide ? `${progress}%` : index < currentSlide ? '100%' : '0%',
                                transition: index === currentSlide ? 'width 50ms linear' : 'width 300ms ease-out'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Main Content Area with swipe */}
            <div
                className="flex-1 flex flex-col items-center justify-center px-6 py-8 pt-16 relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Background gradient - smooth transition */}
                <div
                    className={`absolute inset-0 bg-gradient-to-b ${slide.bgGradient}`}
                    style={{ transition: 'background 0.5s ease-in-out' }}
                />

                {/* Floating orbs for ambient effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className={`absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br ${slide.gradient} blur-3xl opacity-20 animate-float-slow`}
                        style={{ animationDelay: '0s', transition: 'background 0.5s ease-in-out' }}
                    />
                    <div
                        className={`absolute bottom-40 right-10 w-40 h-40 rounded-full bg-gradient-to-br ${slide.gradient} blur-3xl opacity-15 animate-float-slow`}
                        style={{ animationDelay: '1s', transition: 'background 0.5s ease-in-out' }}
                    />
                </div>

                {/* Slide Content with smooth transitions */}
                <div
                    className={`relative z-10 text-center max-w-sm mx-auto ${getSlideAnimationClass()}`}
                    key={currentSlide}
                >
                    {/* Visual Element - Logo, Image, or Icon with breathing animation */}
                    <div className="relative mb-6 flex items-center justify-center">
                        {/* Breathing rings */}
                        <div className="absolute w-44 h-44 rounded-full border-2 border-primary/20 animate-breathe" />
                        <div className="absolute w-52 h-52 rounded-full border border-primary/10 animate-breathe" style={{ animationDelay: '0.5s' }} />
                        <div className="absolute w-60 h-60 rounded-full border border-primary/5 animate-breathe" style={{ animationDelay: '1s' }} />

                        {/* Glow effect */}
                        <div
                            className={`absolute w-36 h-36 rounded-full bg-gradient-to-br ${slide.gradient} blur-2xl opacity-30`}
                            style={{ transition: 'background 0.5s ease-in-out' }}
                        />

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
                    <h1 className="font-serif text-2xl font-bold text-foreground mb-1">
                        {slide.title}
                    </h1>
                    <h2
                        className={`font-serif text-3xl font-bold bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent mb-4`}
                        style={{ transition: 'background 0.5s ease-in-out' }}
                    >
                        {slide.subtitle}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm px-2 mb-5">
                        {slide.description}
                    </p>

                    {/* Feature Tags */}
                    {slide.features && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {slide.features.map((feature, index) => (
                                <span
                                    key={index}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${slide.gradient} text-white shadow-sm`}
                                    style={{ transition: 'background 0.5s ease-in-out' }}
                                >
                                    {feature}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section - Fixed */}
            <div className="px-6 pb-6 pt-2 relative z-10">
                {/* Slide indicators */}
                <div className="flex items-center justify-center gap-2 mb-5">
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
                        Start Your Journey
                        <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="w-full h-11 text-sm rounded-xl text-muted-foreground hover:text-foreground"
                        onClick={() => navigate("/auth")}
                    >
                        Already have an account? <span className="ml-1 text-primary font-medium">Sign In</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default NativeOnboarding;
