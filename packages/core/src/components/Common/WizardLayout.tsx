import { ReactNode, useState } from 'react';

import { Button } from '@form-renderer/components/ui/button';

export interface WizardStep {
  id: string;
  title: string;
  component: ReactNode;
}

interface WizardLayoutProps {
  steps: WizardStep[];
  initialStep?: number;
  onComplete?: () => void;
}

export function WizardLayout({ steps, initialStep = 0, onComplete }: WizardLayoutProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      return;
    }
    setCurrentStepIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div className="flex w-full flex-col space-y-8 p-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">{currentStep.title}</h2>

        {/* Step progress indicators with names */}
        <div className="flex w-full gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-1 flex-col items-center">
              <div
                className={`mb-2 h-2 w-full rounded-full ${
                  index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <span
                className={`text-sm ${
                  index === currentStepIndex ? 'text-primary font-bold' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="w-full">{currentStep.component}</div>

      {/* Navigation buttons */}
      <div className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={handlePrevious} disabled={isFirstStep}>
          Previous
        </Button>
        <Button onClick={handleNext}>{isLastStep ? 'Complete' : 'Next'}</Button>
      </div>
    </div>
  );
}
