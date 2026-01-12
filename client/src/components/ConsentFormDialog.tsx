import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, CheckCircle2 } from "lucide-react";

interface ConsentFormDialogProps {
    open: boolean;
    onClose: () => void;
    onAccept: () => void;
}

const CONSENT_PARAGRAPHS = [
    `By enrolling, I hereby agree to undergo training at Shadanga Kriya's local offline training centre or online training module (website, app), whichever is available. I understand that the training consists of a 30-day continuous meditation training program, followed by self-meditation practice for the next immediate 90 days.`,

    `I acknowledge that I have been adequately explained the need, benefits, and disadvantages of the Shadanga Kriya Training Program. I further understand that if I am unable to give my full attention and concentration in presence of the said training, the expected results may not be achieved, and therefore the Shadanga Kriya training provider does not guarantee 100% of the expected results.`,

    `I am aware that by providing this consent, certain issues such as temporary headache, excessive sleepiness, uneasiness, discomfort, expression of any suppression or of anxiety etc. may occur during the training. In the event where such issues arise, I affirm that I shall take necessary precautions to prevent and correct them at my own responsibility.`,

    `I understand and agree that if any special problem arises during the training due to my existing ailments such as fever, diabetes, asthma, heart disease, seizures, or any other condition, the trainer or any member of the Shadanga Kriya team or the training module (website, app) shall not be responsible for the same.`,

    `I further agree that after starting the training, if I (the trainee) fail to follow the prescribed instructions, the trainer or any member of the Shadanga Kriya team or the training module (website, app) shall not be responsible for any risks associated therewith, and I provide my personal consent to this effect.`,

    `I expressly acknowledge and agree that if, after starting the training, the trainee attempts suicide or experiences suicidal thoughts for any reason whatsoever, the trainer or any member of the Shadanga Kriya team or the training module (website, app) shall not be held responsible.`,

    `By this consent form, I understand and agree that if any trainee participating in the training creates problems for any other trainee or the training source, such trainee's training shall be immediately discontinued and their registration shall be cancelled with immediate effect. I further acknowledge that the fees paid shall not be refunded.`,

    `I acknowledge that even if I receive the expected benefits after completing the Shadanga Kriya training, if any prior problem reoccurs for any reason, the trainer or any member of the Shadanga Kriya team or the training module (website, app) shall not be responsible, and I agree to the same.`,

    `I understand that after enrolling in the Shadanga Kriya training, it shall be my sole responsibility to understand and strictly follow the rules of the training.`,

    `I am informed that the Shadanga Kriya meditation training system involves training fees and applicable GST, and I hereby agree to the same.`,

    `I acknowledge that the training course shall consist of a total of 30 sessions conducted over 30 continuous days (1 session per day), followed by 90 days of uninterrupted self-practice. I further understand that if, due to any unforeseen reason, I am absent from an online or offline session, I shall be provided with two additional sessions subject to prior notice. However, if I remain absent from any session without any reason or prior notice, such missed session shall be considered forfeited, and I shall be required to pay the fee as prescribed by the Shadanga Kriya Training Administration for the additional missed session. I fully agree to these terms.`,

    `I understand that failure to complete or abandonment of the training course shall result in no benefit, and the fees paid shall not be refunded. I have been informed of this condition and provide my full consent.`,

    `I acknowledge that the Shadanga Kriya Training Administration has provided me with complete information regarding the training and its rules. I am consenting to this training method voluntarily, of my own free will, discretion, and informed consent.`
];

const ACKNOWLEDGEMENTS = [
    "That you have read and fully understood all the above information.",
    "That the Shadanga Kriya Training Administration has provided complete information about the training and its rules.",
    "That you have received all information related to this training session and that all your doubts regarding this training have been adequately addressed.",
    "That you are giving your approval/consent by accepting all of the above as a standard.",
    "That if the trainee is incapacitated or a minor, parental/guardian consent is mandatory."
];

export function ConsentFormDialog({ open, onClose, onAccept }: ConsentFormDialogProps) {
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollHeight - scrollTop - clientHeight < 60) {
            setHasScrolledToEnd(true);
        }
    };

    const handleAccept = () => {
        if (hasScrolledToEnd && isChecked) {
            onAccept();
            // Reset for next time
            setHasScrolledToEnd(false);
            setIsChecked(false);
        }
    };

    const handleClose = () => {
        setHasScrolledToEnd(false);
        setIsChecked(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-xl max-h-[85vh] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="p-5 pb-3 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-teal-500 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <DialogTitle className="text-lg font-semibold">
                            Practitioner Consent Form
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {/* Scrollable Content */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="overflow-y-auto p-5 space-y-4"
                    style={{ maxHeight: "50vh" }}
                >
                    {CONSENT_PARAGRAPHS.map((para, i) => (
                        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                            {para}
                        </p>
                    ))}

                    {/* Acknowledgements */}
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="font-medium text-sm mb-3">By clicking "I Agree", you acknowledge:</p>
                        <ul className="space-y-2">
                            {ACKNOWLEDGEMENTS.map((ack, i) => (
                                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                    <span className="text-amber-600">{i + 1}.</span>
                                    {ack}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-4 border-t space-y-4">
                    {/* Checkbox */}
                    <label
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${hasScrolledToEnd
                                ? 'border-teal-300 bg-teal-50/50 dark:bg-teal-950/20'
                                : 'border-muted opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <Checkbox
                            checked={isChecked}
                            disabled={!hasScrolledToEnd}
                            onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                            className="mt-0.5"
                        />
                        <span className="text-sm">
                            I have read, understood, and agree to all the terms and conditions above.
                        </span>
                    </label>

                    {!hasScrolledToEnd && (
                        <p className="text-xs text-muted-foreground text-center">
                            ↓ Scroll to read the complete form
                        </p>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAccept}
                            disabled={!hasScrolledToEnd || !isChecked}
                            className="flex-1 bg-teal-500 hover:bg-teal-600"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            I Agree
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
