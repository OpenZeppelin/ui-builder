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
      <div className="-mx-6 -mt-6 mb-8 bg-card px-6 pt-6 pb-5 border-b shadow-sm rounded-t-lg">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold">{currentStep.title}</h2>
        </div>

        {/* Step progress indicators with names */}
        <div className="flex w-full gap-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-1 flex-col items-center">
              <div
                className={`mb-2 h-3 w-full rounded-full ${
                  index <= currentStepIndex ? 'bg-primary shadow-sm' : 'bg-muted'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  index === currentStepIndex
                    ? 'text-primary font-bold'
                    : index < currentStepIndex
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground'
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
        {/* Sidebar widget - Only show when not on the first step */}
        {sidebarWidget && !isFirstStep && (
          <div className={isWidgetExpanded ? 'w-80 shrink-0 mr-6' : 'shrink-0'}>
            {sidebarWidget}
          </div>
        )}

        {/* Step content */}
        <div className="w-full">{currentStep.component}</div>
      </div>

      <div className="mt-8 -mx-6 -mb-6 bg-muted px-6 py-4 border-t shadow-inner flex justify-between items-center rounded-b-lg">
        <div>
          {!isFirstStep && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
        </div>
        {!isLastStep && (
          <Button onClick={handleNext} disabled={!isCurrentStepValid}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
