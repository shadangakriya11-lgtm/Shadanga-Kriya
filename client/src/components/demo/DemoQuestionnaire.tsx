import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionnaireResponse } from "@/lib/api";

interface DemoQuestionnaireProps {
    onComplete: (responses: QuestionnaireResponse) => void;
    onSkip: () => void;
}

const questions = [
    {
        id: "question1",
        title: "प्रश्न 1 – Identity Shift (Self-Image)",
        question: "क्या आप खुद को ऐसा व्यक्ति बनते देखना चाहते हैं जो तनाव में भी शांत और संतुलित रहता हो?",
        options: [
            { value: "yes", label: "हाँ, बिल्कुल" },
            { value: "sometimes", label: "कभी-कभी" },
            { value: "not_sure", label: "अभी निश्चित नहीं" },
        ],
    },
    {
        id: "question2",
        title: "प्रश्न 2 – Emotional Cost (Loss Aversion)",
        question: "अगर तनाव और बेचैनी ऐसे ही बनी रही, तो इसका सबसे ज़्यादा असर किस पर पड़ेगा?",
        options: [
            { value: "health", label: "मेरी सेहत" },
            { value: "career", label: "मेरा काम / करियर" },
            { value: "relationships", label: "मेरे रिश्ते" },
            { value: "sleep", label: "मेरी नींद" },
            { value: "confidence", label: "मेरा आत्मविश्वास" },
        ],
    },
    {
        id: "question3",
        title: "प्रश्न 3 – Desire for Guidance (Trust)",
        question: "क्या आपने कभी महसूस किया है कि सही मार्गदर्शन मिलने पर ध्यान आपके लिए आसान हो सकता है?",
        options: [
            { value: "need_guidance", label: "हाँ, मार्गदर्शन की ज़रूरत है" },
            { value: "difficult_alone", label: "अकेले करना मुश्किल लगता है" },
            { value: "not_found", label: "अभी तक सही तरीका नहीं मिला" },
        ],
    },
    {
        id: "question4",
        title: "प्रश्न 4 – Exclusivity & Value",
        question: "अगर एक अनुभव सिर्फ चुनिंदा लोगों के लिए हो और सामान्य कंटेंट से अलग हो, तो क्या आप उसे आज़माना चाहेंगे?",
        options: [
            { value: "yes", label: "हाँ, ज़रूर" },
            { value: "understand_first", label: "पहले समझना चाहूँगा/चाहूँगी" },
            { value: "maybe", label: "शायद" },
        ],
    },
    {
        id: "question5",
        title: "प्रश्न 5 – Investment in Self (Purchase Readiness)",
        question: "क्या आप अपने मन की शांति के लिए समय और ऊर्जा निवेश करने को तैयार हैं?",
        options: [
            { value: "yes_now", label: "हाँ, अभी" },
            { value: "soon", label: "जल्द ही" },
            { value: "not_now", label: "अभी नहीं" },
        ],
    },
];

export function DemoQuestionnaire({ onComplete, onSkip }: DemoQuestionnaireProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [responses, setResponses] = useState<Record<string, string>>({});

    const handleOptionSelect = (value: string) => {
        setResponses((prev) => ({
            ...prev,
            [questions[currentQuestion].id]: value,
        }));
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Complete questionnaire
            onComplete({
                question1: responses.question1 || "",
                question2: responses.question2 || "",
                question3: responses.question3 || "",
                question4: responses.question4 || "",
                question5: responses.question5 || "",
            });
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const currentQ = questions[currentQuestion];
    const hasAnswer = !!responses[currentQ.id];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50">
                <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="font-serif text-lg font-semibold">Demo Meditation</h1>
                            <p className="text-xs text-muted-foreground">
                                प्रश्न {currentQuestion + 1} / {questions.length}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onSkip}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-muted">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full">
                <Card className="flex-1 border-0 shadow-xl bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 md:p-8 flex flex-col h-full">
                        {/* Question Title */}
                        <div className="mb-6">
                            <p className="text-xs uppercase tracking-wider text-primary font-medium mb-2">
                                {currentQ.title}
                            </p>
                            <h2 className="font-serif text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
                                {currentQ.question}
                            </h2>
                        </div>

                        {/* Options */}
                        <RadioGroup
                            value={responses[currentQ.id] || ""}
                            onValueChange={handleOptionSelect}
                            className="flex-1 space-y-3"
                        >
                            {currentQ.options.map((option, index) => (
                                <div
                                    key={option.value}
                                    className={cn(
                                        "relative flex items-center rounded-xl border-2 transition-all duration-200 cursor-pointer",
                                        responses[currentQ.id] === option.value
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "border-border hover:border-primary/50 bg-background/50"
                                    )}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <Label
                                        htmlFor={`${currentQ.id}-${option.value}`}
                                        className="flex items-center gap-4 w-full p-4 cursor-pointer"
                                    >
                                        <RadioGroupItem
                                            value={option.value}
                                            id={`${currentQ.id}-${option.value}`}
                                            className="h-5 w-5"
                                        />
                                        <span className="text-base md:text-lg">{option.label}</span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 gap-4">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentQuestion === 0}
                        className="flex-1 max-w-[120px]"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        पीछे
                    </Button>

                    <Button
                        variant="default"
                        onClick={handleNext}
                        disabled={!hasAnswer}
                        className="flex-1 max-w-[200px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                        {currentQuestion === questions.length - 1 ? "आगे बढ़ें" : "अगला"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>

                {/* Skip option */}
                <Button
                    variant="link"
                    onClick={onSkip}
                    className="mt-4 text-muted-foreground hover:text-foreground"
                >
                    Demo छोड़ें
                </Button>
            </main>
        </div>
    );
}
