import { Check } from 'lucide-react';

import { ReactNode } from 'react';
import React from 'react';

import { Button } from '@openzeppelin/contracts-ui-builder-ui';

export interface WizardStep {
  id: string;
  title: string;
  component: ReactNode;
  isValid?: boolean;
}

interface WizardLayoutProps {
  steps: WizardStep[];
  onComplete?: () => void;
  sidebarWidget?: ReactNode;
  isWidgetExpanded?: boolean;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
}

export function WizardLayout({
  steps,
  onComplete,
  sidebarWidget,
  isWidgetExpanded = false,
  currentStepIndex,
  onStepChange,
}: WizardLayoutProps) {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      return;
    }
    onStepChange(currentStepIndex + 1);
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const currentStep = steps[currentStepIndex];
  const isCurrentStepValid = currentStep.isValid !== false;

  return (
    <div className="flex w-full flex-col space-y-8 p-6">
      <div className="-mx-6 -mt-6 mb-8 bg-card px-6 pt-6 pb-5 border-b shadow-sm rounded-t-lg">
        {/* Mobile-only current step title */}
        <div className="sm:hidden mb-4 text-center">
          <h3 className="text-lg font-semibold text-foreground">{steps[currentStepIndex].title}</h3>
        </div>

        {/* Minimal step progress indicators with merged labels */}
        <div className="flex w-full items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`
                  flex items-center gap-2 rounded-full text-sm font-medium
                  transition-all duration-300 ease-in-out
                  px-2 py-1 sm:px-3 sm:py-1.5
                  ${
                    index <= currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }
                `}
                title={step.title}
                aria-label={`Step ${index + 1}: ${step.title}`}
              >
                <span className="flex h-4 w-4 items-center justify-center text-xs font-bold">
                  {index < currentStepIndex ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span className="hidden sm:block">{step.title}</span>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-px flex-1 transition-all duration-300 ease-in-out
                    mx-2 sm:mx-3
                    ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}
                  `}
                />
              )}
            </React.Fragment>
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
        {!isLastStep && !isFirstStep && currentStepIndex !== 2 && (
          <Button onClick={handleNext} disabled={!isCurrentStepValid}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
