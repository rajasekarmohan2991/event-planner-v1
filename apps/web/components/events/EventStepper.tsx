'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then(m => m.Player), { ssr: false });
import { cn } from '@/lib/utils';
import { BasicInfoStep, EventDetailsStep, ScheduleStep, MediaStep, LegalStep, ReviewStep } from './EventFormSteps';

const steps = [
  { id: 'basic', title: 'Basic Info' },
  { id: 'details', title: 'Event Details' },
  { id: 'schedule', title: 'Date & Time' },
  { id: 'media', title: 'Media & Extras' },
  { id: 'legal', title: 'Terms & Manager' },
  { id: 'review', title: 'Review & Submit' },
];

export function EventStepper({ 
  onComplete,
  onFormDataChange 
}: { 
  onComplete: (data: any) => Promise<void>
  onFormDataChange?: (data: any) => void
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    basic: {},
    details: {},
    schedule: {},
    media: {},
    legal: {},
  });

  // Show a tiny flourish on step change
  const [showFlourish, setShowFlourish] = useState(false);
  useEffect(() => {
    setShowFlourish(true);
    const t = setTimeout(() => setShowFlourish(false), 800);
    return () => clearTimeout(t);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepSubmit = (stepData: any) => {
    const updatedFormData = {
      ...formData,
      [steps[currentStep].id]: stepData
    };
    
    setFormData(updatedFormData);
    
    // Notify parent of form data changes (for image preview)
    onFormDataChange?.(updatedFormData);
    
    if (currentStep === steps.length - 1) {
      handleSubmit();
    } else {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const completeFormData = {
        ...formData.basic,
        ...formData.details,
        ...formData.schedule,
        ...formData.media,
        ...formData.legal,
      };
      await onComplete(completeFormData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'basic':
        return <BasicInfoStep onSubmit={handleStepSubmit} initialData={formData.basic} />;
      case 'details':
        // Pass combined data including type, category, capacity from basic step
        return <EventDetailsStep onSubmit={handleStepSubmit} initialData={{...formData.basic, ...formData.details}} />;
      case 'schedule':
        return <ScheduleStep onSubmit={handleStepSubmit} initialData={formData.schedule} />;
      case 'media':
        return <MediaStep 
          onSubmit={handleStepSubmit} 
          initialData={{...formData.basic, ...formData.media}}
          onImageUpload={(imageUrl) => {
            // Immediately update parent when image uploads
            const updatedFormData = {
              ...formData,
              media: { ...formData.media, imageUrl }
            };
            setFormData(updatedFormData);
            onFormDataChange?.(updatedFormData);
          }}
        />;
      case 'legal':
        return <LegalStep onSubmit={handleStepSubmit} initialData={formData.legal} />;
      case 'review':
        return <ReviewStep 
          data={{
            ...formData.basic,
            ...formData.details,
            ...formData.schedule,
            ...formData.media,
            ...formData.legal,
          }} 
          onSubmit={handleStepSubmit} 
        />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative mb-8">
        <div className="flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const status = isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending';
            return (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  {/* Indicator */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center rounded-full",
                    isCurrent ? "h-9 w-9 bg-primary text-primary-foreground" : isCompleted ? "h-8 w-8 bg-emerald-100 text-emerald-600" : "h-8 w-8 border-2 border-slate-300 text-slate-400"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-medium">{index + 1}</span>}
                  </div>
                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "ml-3 h-1 flex-1 rounded-full",
                      isCompleted ? "bg-emerald-500" : isCurrent ? "bg-primary/60" : "bg-slate-200"
                    )} />
                  )}
                </div>
                {/* Labels */}
                <div className="mt-2 pl-1">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">STEP {index + 1}</div>
                  <div className={cn("text-sm font-medium", isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground")}>{step.title}</div>
                  <div className={cn(
                    "text-xs",
                    isCompleted ? "text-emerald-600" : isCurrent ? "text-sky-600" : "text-slate-400"
                  )}>{status}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="relative overflow-hidden">
        <CardHeader className="relative">
          <CardTitle className="pr-14">{steps[currentStep].title}</CardTitle>
          {/* Small flourish animation in header on step change */}
          <div className="absolute right-4 top-3 h-8 w-8 pointer-events-none">
            <AnimatePresence>
              {showFlourish && (
                <motion.div
                  key={`flourish-${currentStep}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.25 }}
                  className="h-8 w-8"
                >
                  <Player
                    autoplay
                    keepLastFrame
                    src="https://assets8.lottiefiles.com/packages/lf20_6wutsrox.json"
                    style={{ width: '32px', height: '32px' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[currentStep].id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 0 || isSubmitting}
          >
            Previous
          </Button>
          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={() => {
                  const form = document.getElementById('step-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                disabled={isSubmitting}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : 'Submit'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Re-export the step components for use elsewhere
export { BasicInfoStep, EventDetailsStep, ScheduleStep, MediaStep, ReviewStep };
