import { ReactNode, useState } from 'react';

import { Button } from '@openzeppelin/transaction-form-renderer';

export interface WizardStep {
  id: string;
  title: string;
  component: ReactNode;
  isValid?: boolean;
}

interface WizardLayoutProps {
  steps: WizardStep[];
  initialStep?: number;
  onComplete?: () => void;
  sidebarWidget?: ReactNode;
  isWidgetExpanded?: boolean;
}

export function WizardLayout({
  steps,
  initialStep = 0,
  onComplete,
  sidebarWidget,
  isWidgetExpanded = false,
}: WizardLayoutProps) {
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
  const isCurrentStepValid = currentStep.isValid !== false;

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
                className={`text-xs ${
                  index === currentStepIndex ? 'text-primary font-bold' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content area with optional sidebar */}
      <div className="flex w-full relative">
        {/* Step content */}
        <div className="w-full">{currentStep.component}</div>

        {/* Sidebar widget (if provided) */}
        {sidebarWidget && (
          <div className={isWidgetExpanded ? 'w-80 shrink-0 ml-6' : 'shrink-0'}>
            {sidebarWidget}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={handlePrevious} disabled={isFirstStep}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!isCurrentStepValid}>
          {isLastStep ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
