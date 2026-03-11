import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Download,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentLinkPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentId, setPaymentId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  
  const [hasDiscountCode, setHasDiscountCode] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payment-links/course/${courseId}`
      );
      
      if (!response.ok) throw new Error('Course not found');
      
      const data = await response.json();
      setCourse(data.course);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateDiscount = async () => {
    if (!discountCode.trim() || !course) return;

    setIsValidatingCode(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/discounts/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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

  const handlePayment = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Required Fields',
        description: 'Please enter your name and email',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payment-links/process`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            courseId: course.id,
            discountCode: appliedDiscount?.code || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Shadanga Kriya',
        description: `Enrollment for ${data.courseTitle}`,
        order_id: data.orderId,
        handler: async function (razorpayResponse: any) {
          try {
            const verifyResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/api/payment-links/verify`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: razorpayResponse.razorpay_order_id,
                  razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                  razorpay_signature: razorpayResponse.razorpay_signature,
                  userId: data.userId,
                  courseId: course.id,
                  discountInfo: data.discountInfo,
                }),
              }
            );

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            setPaymentId(verifyData.payment.id);
            setPaymentStep('success');
            setIsProcessing(false);
          } catch (error: any) {
            console.error('Verification error:', error);
            setPaymentStep('error');
            setErrorMessage(error.message || 'Payment verification failed');
            setIsProcessing(false);
          }
        },
        theme: {
          color: '#2d9d92',
        },
        prefill: {
          name: formData.name,
          email: formData.email,
        },
        modal: {
          ondismiss: function () {
            setPaymentStep('form');
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStep('error');
      setErrorMessage(error.message || 'Something went wrong');
      setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = () => {
    window.open(`${import.meta.env.VITE_API_URL}/api/exports/payment-receipt/${paymentId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
          <p className="text-muted-foreground">This course is not available or the link is invalid.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {paymentStep === 'success' ? (
          <Card className="p-8 text-center animate-scale-in">
            <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
              Payment Successful!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your enrollment is complete. Check your email for login credentials.
            </p>
            <div className="space-y-3">
              <Button onClick={handleDownloadReceipt} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Go to Home
              </Button>
            </div>
          </Card>
        ) : paymentStep === 'error' ? (
          <Card className="p-8 text-center animate-scale-in">
            <div className="h-16 w-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
              Payment Failed
            </h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <Button variant="outline" onClick={() => setPaymentStep('form')}>
              Try Again
            </Button>
          </Card>
        ) : paymentStep === 'processing' ? (
          <Card className="p-12 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="font-medium text-lg">Initializing Secure Payment</h3>
            <p className="text-muted-foreground">Please wait...</p>
          </Card>
        ) : (
          <>
            {/* Course Info */}
            <Card className="p-6 mb-6">
              <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
                {course.title}
              </h1>
              <p className="text-muted-foreground mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.lesson_count} lessons</span>
                </div>
                {course.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment Form */}
            <Card className="p-6">
              <h2 className="font-serif text-xl font-semibold mb-4">Complete Your Enrollment</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Login credentials will be sent to this email
                  </p>
                </div>
              </div>

              {/* Price Display */}
              <div className="space-y-2 mb-6">
                {appliedDiscount ? (
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
                      <span className="font-medium text-foreground">Total Amount</span>
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
                  <div className="flex items-center justify-between py-3 border-t border-b border-border">
                    <span className="text-muted-foreground">Course Fee</span>
                    <span className="font-serif text-2xl font-bold text-foreground">
                      ₹{course.price?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Discount Code Section */}
              <div className="space-y-3 mb-6">
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
                    className="text-sm font-medium leading-none cursor-pointer"
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

              {/* Security Notice */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                <Shield className="h-4 w-4" />
                <span>Secure payment powered by Razorpay</span>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{finalAmount.toLocaleString()}
                  </>
                )}
              </Button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
