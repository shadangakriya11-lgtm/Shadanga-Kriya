import { useState } from "react";
import { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tag,
  X,
  Apple,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { paymentsApi, getCachedToken } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { isIOSApp } from "@/lib/platformDetection";
import { Capacitor } from "@capacitor/core";
import { useRevenueCat } from "@/hooks/useRevenueCat";

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
  const queryClient = useQueryClient();
  const { purchaseCourse } = useRevenueCat();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "details" | "processing" | "success" | "error"
  >("details");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Discount code state
  const [hasDiscountCode, setHasDiscountCode] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);

  const handleValidateDiscount = async () => {
    if (!discountCode.trim() || !course) return;

    setIsValidatingCode(true);
    try {
      const token = getCachedToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/discounts/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            code: discountCode.toUpperCase(),
            courseId: course.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.valid) {
        toast({
          title: 'Invalid Code',
          description: data.error || 'This discount code is not valid',
          variant: 'destructive',
        });
        setAppliedDiscount(null);
        return;
      }

      // Calculate discount
      const originalPrice = course.price || 0;
      const discountPercent = data.discountCode.discountPercent;
      const discountAmount = Math.round((originalPrice * discountPercent) / 100);
      const finalPrice = originalPrice - discountAmount;

      setAppliedDiscount({
        code: data.discountCode.code,
        discountPercent,
        discountAmount,
        finalPrice,
      });

      toast({
        title: 'Discount Applied!',
        description: `${discountPercent}% off - You save ₹${discountAmount}`,
      });
    } catch (error) {
      console.error('Error validating discount code:', error);
      toast({
        title: 'Error',
        description: 'Failed to validate discount code',
        variant: 'destructive',
      });
      setAppliedDiscount(null);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  const finalAmount = appliedDiscount ? appliedDiscount.finalPrice : (course?.price || 0);

  // ─── iOS: Purchase via RevenueCat / App Store ───────────────
  const handleIOSPurchase = async () => {
    if (!course || !user) return;

    setIsProcessing(true);
    setPaymentStep("processing");

    try {
      const purchased = await purchaseCourse();

      if (purchased) {
        // Tell the backend to create payment + enrollment records
        const token = getCachedToken();
        await fetch(`${import.meta.env.VITE_API_URL}/api/payments/ios-purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ courseId: course.id }),
        });

        // Invalidate queries to refresh enrollment status
        await queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
        await queryClient.invalidateQueries({ queryKey: ["courses"] });
        await queryClient.invalidateQueries({ queryKey: ["myPayments"] });

        setPaymentStep("success");

        setTimeout(() => {
          onSuccess(course.id);
          toast({
            title: "Purchase Successful!",
            description: `You now have access to "${course.title}"`,
          });
          setPaymentStep("details");
          setIsProcessing(false);
          onClose();
        }, 2000);
      } else {
        // User cancelled or purchase failed
        setPaymentStep("details");
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("iOS purchase error:", error);
      setPaymentStep("error");
      setErrorMessage(error.message || "App Store purchase failed");
      setIsProcessing(false);
    }
  };

  // ─── Android / Web: Purchase via Razorpay ──────────────────
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
      const orderData = await paymentsApi.createRazorpayOrder(course.id, finalAmount);

      // 3. Open Razorpay Checkout
      // Note: Logo only works with publicly accessible HTTPS URLs
      // For localhost, the logo won't display due to CORS restrictions
      const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
      
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Shadanga Kriya",
        description: `Enrollment for ${course.title}`,
        // Only include image if not on localhost
        ...((!isLocalhost) && { image: `${window.location.origin}/shadanga-kriya-logo.png` }),
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 4. Verify payment on backend
            await paymentsApi.verifyRazorpay({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Invalidate queries to refresh enrollment status
            await queryClient.invalidateQueries({
              queryKey: ["myEnrollments"],
            });
            await queryClient.invalidateQueries({ queryKey: ["courses"] });
            await queryClient.invalidateQueries({ queryKey: ["myPayments"] });

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

  const isIOS = isIOSApp();

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
              {isIOS ? 'Connecting to App Store...' : 'Please wait while we connect to Razorpay...'}
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
            <div className="space-y-2">
              {appliedDiscount && !isIOS ? (
                <>
                  <div className="flex items-center justify-between py-2 text-sm">
                    <span className="text-muted-foreground">Original Price</span>
                    <span className="line-through text-muted-foreground">
                      ₹{course.price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-sm">
                    <span className="text-success flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      Discount ({appliedDiscount.discountPercent}%)
                    </span>
                    <span className="text-success font-medium">
                      -₹{appliedDiscount.discountAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-b border-border">
                    <span className="font-medium text-foreground">Final Amount</span>
                    <span className="font-serif text-2xl font-bold text-success">
                      ₹{appliedDiscount.finalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Badge variant="active" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {appliedDiscount.code}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveDiscount}
                      className="h-auto p-1 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between py-3 border-t border-b border-border">
                    <span className="text-muted-foreground">Course Fee</span>
                    <span className="font-serif text-2xl font-bold text-foreground">
                      ₹{course.price?.toLocaleString()}
                    </span>
                  </div>
                  {isIOS && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      One-time purchase • Lifetime access
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Discount Code Section - Only for non-iOS */}
            {!isIOS && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasDiscount"
                  checked={hasDiscountCode}
                  onCheckedChange={(checked) => {
                    setHasDiscountCode(checked as boolean);
                    if (!checked) {
                      setDiscountCode('');
                      setAppliedDiscount(null);
                    }
                  }}
                  disabled={!!appliedDiscount}
                />
                <Label
                  htmlFor="hasDiscount"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I have a discount code
                </Label>
              </div>

              {hasDiscountCode && !appliedDiscount && (
                <div className="flex gap-2 animate-in slide-in-from-top-2">
                  <Input
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleValidateDiscount();
                      }
                    }}
                    disabled={isValidatingCode}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleValidateDiscount}
                    disabled={!discountCode.trim() || isValidatingCode}
                  >
                    {isValidatingCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
              )}
            </div>
            )}

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Shield className="h-4 w-4" />
              <span>{isIOS ? 'Managed by Apple • Secure payment' : 'Secure payment processing'}</span>
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
                onClick={isIOS ? handleIOSPurchase : handlePayment}
                disabled={isProcessing}
                className="min-w-[140px]"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : isIOS ? (
                  <>
                    <Apple className="h-5 w-5 mr-2" />
                    Buy with App Store
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{finalAmount.toLocaleString()}
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
