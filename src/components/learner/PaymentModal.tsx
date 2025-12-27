import { useState } from 'react';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { BookOpen, Clock, Shield, CreditCard, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PaymentModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

export function PaymentModal({ course, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');

  const handlePayment = async () => {
    if (!course) return;
    
    setIsProcessing(true);
    setPaymentStep('processing');

    // Simulate Razorpay payment flow
    // In production, this would integrate with Razorpay SDK
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPaymentStep('success');
      
      setTimeout(() => {
        onSuccess(course.id);
        toast({
          title: "Payment Successful!",
          description: `You now have access to "${course.title}"`,
        });
        setPaymentStep('details');
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (error) {
      setIsProcessing(false);
      setPaymentStep('details');
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {paymentStep === 'success' ? (
          <div className="py-8 text-center animate-scale-in">
            <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
              Payment Successful!
            </h3>
            <p className="text-muted-foreground">
              Redirecting to your course...
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Purchase Course</DialogTitle>
              <DialogDescription>
                Complete your purchase to unlock this course
              </DialogDescription>
            </DialogHeader>

            {/* Course Info */}
            <div className="bg-muted/50 rounded-xl p-4 my-4">
              <div className="flex gap-2 mb-2">
                <Badge variant={course.type === 'self' ? 'self' : 'onsite'}>
                  {course.type === 'self' ? 'Self-Paced' : 'On-Site'}
                </Badge>
              </div>
              <h3 className="font-medium text-foreground mb-2">{course.title}</h3>
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
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
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
