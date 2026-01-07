import { useState } from "react";
import { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Clock,
  Shield,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { paymentsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface PaymentModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

export function PaymentModal({
  course,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "details" | "processing" | "success" | "error"
  >("details");
  const [errorMessage, setErrorMessage] = useState("");

  const handlePayment = async () => {
    if (!course || !user) return;

    setIsProcessing(true);
    setPaymentStep("processing");

    try {
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error(
          "Razorpay SDK failed to load. Please check your internet connection."
        );
      }

      // 2. Create order on backend
      const orderData = await paymentsApi.createRazorpayOrder(course.id);

      // 3. Open Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Serene Flow",
        description: `Enrollment for ${course.title}`,
        image: "/logo.png",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 4. Verify payment on backend
            await paymentsApi.verifyRazorpay({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setPaymentStep("success");

            setTimeout(() => {
              onSuccess(course.id);
              toast({
                title: "Payment Successful!",
                description: `You now have access to "${course.title}"`,
              });
              setPaymentStep("details");
              setIsProcessing(false);
              onClose();
            }, 2000);
          } catch (error: any) {
            console.error("Verification error:", error);
            setPaymentStep("error");
            setErrorMessage(error.message || "Payment verification failed");
            setIsProcessing(false);
          }
        },
        theme: {
          color: "#2d9d92",
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone || undefined,
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "UPI",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["upi", "card", "netbanking", "wallet"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        modal: {
          ondismiss: function () {
            setPaymentStep("details");
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentStep("error");
      setErrorMessage(
        error.message || "Something went wrong while initiating payment"
      );
      setIsProcessing(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {paymentStep === "success" ? (
          <div className="py-8 text-center animate-scale-in">
            <DialogTitle className="sr-only">Payment Successful</DialogTitle>
            <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
              Payment Successful!
            </h3>
            <p className="text-muted-foreground">
              Your course is being unlocked...
            </p>
          </div>
        ) : paymentStep === "error" ? (
          <div className="py-8 text-center animate-scale-in">
            <DialogTitle className="sr-only">Payment Failed</DialogTitle>
            <div className="h-16 w-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
              Payment Failed
            </h3>
            <p className="text-muted-foreground mb-6 px-4">{errorMessage}</p>
            <Button variant="outline" onClick={() => setPaymentStep("details")}>
              Try Again
            </Button>
          </div>
        ) : paymentStep === "processing" ? (
          <div className="py-12 text-center">
            <DialogTitle className="sr-only">Processing Payment</DialogTitle>
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="font-medium text-lg">Initializing Secure Payment</h3>
            <p className="text-muted-foreground">
              Please wait while we connect to Razorpay...
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                Purchase Course
              </DialogTitle>
              <DialogDescription>
                Complete your purchase to unlock this course
              </DialogDescription>
            </DialogHeader>

            {/* Course Info */}
            <div className="bg-muted/50 rounded-xl p-4 my-4">
              <div className="flex gap-2 mb-2">
                <Badge variant={course.type === "self" ? "self" : "onsite"}>
                  {course.type === "self" ? "Self-Paced" : "On-Site"}
                </Badge>
              </div>
              <h3 className="font-medium text-foreground mb-2">
                {course.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between py-3 border-t border-b border-border">
              <span className="text-muted-foreground">Course Fee</span>
              <span className="font-serif text-2xl font-bold text-foreground">
                ₹{course.price?.toLocaleString()}
              </span>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Shield className="h-4 w-4" />
              <span>Secure payment powered by Razorpay</span>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="premium"
                onClick={handlePayment}
                disabled={isProcessing}
                className="min-w-[140px]"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{course.price?.toLocaleString()}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
