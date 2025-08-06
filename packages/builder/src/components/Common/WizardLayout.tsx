import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { ReactNode } from 'react';

import { Button } from '@openzeppelin/contracts-ui-builder-ui';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import { useAnalytics } from '../../hooks/useAnalytics';

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
  const { trackWizardStep } = useAnalytics();

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      return;
    }
    const nextStepIndex = currentStepIndex + 1;
    const nextStep = steps[nextStepIndex];

    // Track wizard step progression
    trackWizardStep(nextStepIndex + 1, nextStep.id); // Step numbers are 1-indexed for analytics

    onStepChange(nextStepIndex);
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStepIndex = currentStepIndex - 1;
      const prevStep = steps[prevStepIndex];

      // Track wizard step progression (going backwards)
      trackWizardStep(prevStepIndex + 1, prevStep.id); // Step numbers are 1-indexed for analytics

      onStepChange(prevStepIndex);
    }
  };

  const currentStep = steps[currentStepIndex];
  const isCurrentStepValid = currentStep.isValid !== false;

  return (
    <div className="flex w-full flex-col space-y-8 p-6">
      <div className="-mx-6 -mt-6 mb-8 bg-card px-6 pt-6 pb-5">
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

      <div className="mt-8 flex justify-between items-center">
        <div>
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className={cn(
                // TODO: Replace with OpenZeppelin theme colors
                // Should use semantic tokens like 'bg-secondary hover:bg-secondary-hover'
                'bg-neutral-100 border-neutral-100 text-black hover:bg-neutral-200',
                'flex items-center gap-2 pl-3 pr-6 py-2.5 h-11'
              )}
            >
              <ChevronLeft className="size-3" />
              Back
            </Button>
          )}
        </div>
        {!isLastStep && !isFirstStep && currentStepIndex !== 2 && (
          <Button
            onClick={handleNext}
            disabled={!isCurrentStepValid}
            className={cn(
              // TODO: Replace hard-coded colors with OpenZeppelin theme for Tailwind
              // Should use semantic tokens like 'bg-primary hover:bg-primary-hover'
              'bg-[#5850ec] hover:bg-[#4940d1] text-white',
              'flex items-center gap-2 pl-6 pr-3 py-2.5 h-11'
            )}
          >
            Next
            <ChevronRight className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
