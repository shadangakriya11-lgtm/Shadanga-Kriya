import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DemoQuestionnaire } from "@/components/demo/DemoQuestionnaire";
import { DemoConfirmation } from "@/components/demo/DemoConfirmation";
import { DemoProtocol } from "@/components/demo/DemoProtocol";
import { DemoPlayer } from "@/components/demo/DemoPlayer";
import { useDemoStatus, useSubmitQuestionnaire, useSkipDemo } from "@/hooks/useApi";
import { QuestionnaireResponse } from "@/lib/api";
import { Loader2 } from "lucide-react";

type DemoStep = "questionnaire" | "confirmation" | "protocol" | "player";

export default function Demo() {
    const navigate = useNavigate();
    const { data: demoStatus, isLoading: statusLoading } = useDemoStatus();
    const submitQuestionnaire = useSubmitQuestionnaire();
    const skipDemo = useSkipDemo();

    const [currentStep, setCurrentStep] = useState<DemoStep>("questionnaire");
    const [questionnaireResponses, setQuestionnaireResponses] = useState<QuestionnaireResponse | null>(null);

    // Redirect if demo already watched or skipped
    useEffect(() => {
        if (demoStatus && !demoStatus.showDemo) {
            navigate("/home", { replace: true });
        }
    }, [demoStatus, navigate]);

    // Loading state
    if (statusLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Questionnaire completed
    const handleQuestionnaireComplete = async (responses: QuestionnaireResponse) => {
        setQuestionnaireResponses(responses);
        await submitQuestionnaire.mutateAsync(responses);
        setCurrentStep("confirmation");
    };

    // Skip demo
    const handleSkip = async () => {
        await skipDemo.mutateAsync();
        navigate("/home", { replace: true });
    };

    // Confirmation done, move to protocol
    const handleConfirmationComplete = () => {
        setCurrentStep("protocol");
    };

    // Protocol completed, start player
    const handleProtocolComplete = () => {
        setCurrentStep("player");
    };

    // Demo completed, redirect to home
    const handleDemoComplete = () => {
        navigate("/home", { replace: true });
    };

    // Back from confirmation to questionnaire
    const handleBackToQuestionnaire = () => {
        setCurrentStep("questionnaire");
    };

    // Back from protocol to confirmation
    const handleBackToConfirmation = () => {
        setCurrentStep("confirmation");
    };

    // Back from player to protocol
    const handleBackToProtocol = () => {
        setCurrentStep("protocol");
    };

    // Render current step
    switch (currentStep) {
        case "questionnaire":
            return (
                <DemoQuestionnaire
                    onComplete={handleQuestionnaireComplete}
                    onSkip={handleSkip}
                />
            );

        case "confirmation":
            return (
                <DemoConfirmation
                    onConfirm={handleConfirmationComplete}
                    onBack={handleBackToQuestionnaire}
                    onSkip={handleSkip}
                />
            );

        case "protocol":
            return (
                <DemoProtocol
                    onStart={handleProtocolComplete}
                    onBack={handleBackToConfirmation}
                />
            );

        case "player":
            return (
                <DemoPlayer
                    onComplete={handleDemoComplete}
                    onBack={handleBackToProtocol}
                />
            );

        default:
            return null;
    }
}
