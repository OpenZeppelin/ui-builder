import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WizardLayout, type WizardStep } from '../WizardLayout';

const mockTrackWizardStep = vi.fn();

vi.mock('../../../hooks/useBuilderAnalytics', () => ({
  useBuilderAnalytics: () => ({
    trackWizardStep: mockTrackWizardStep,
  }),
}));

const steps: WizardStep[] = [
  { id: 'chain', title: 'Chain', component: <div>chain</div> },
  { id: 'contract', title: 'Contract', component: <div>contract</div> },
  { id: 'function', title: 'Function', component: <div>function</div> },
  { id: 'customize', title: 'Customize', component: <div>customize</div> },
  { id: 'complete', title: 'Complete', component: <div>complete</div> },
];

const analyticsContext = { networkId: 'ethereum-mainnet', ecosystem: 'evm' };

describe('WizardLayout analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fires wizard_step exactly once per Next click with the entered step and context', () => {
    const onStepChange = vi.fn();
    render(
      <WizardLayout
        steps={steps}
        currentStepIndex={1}
        onStepChange={onStepChange}
        analyticsContext={analyticsContext}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(mockTrackWizardStep).toHaveBeenCalledTimes(1);
    expect(mockTrackWizardStep).toHaveBeenCalledWith(3, 'function', analyticsContext);
    expect(onStepChange).toHaveBeenCalledWith(2);
  });

  it('fires wizard_step exactly once per Back click with the entered step and context', () => {
    const onStepChange = vi.fn();
    render(
      <WizardLayout
        steps={steps}
        currentStepIndex={3}
        onStepChange={onStepChange}
        analyticsContext={analyticsContext}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(mockTrackWizardStep).toHaveBeenCalledTimes(1);
    expect(mockTrackWizardStep).toHaveBeenCalledWith(3, 'function', analyticsContext);
    expect(onStepChange).toHaveBeenCalledWith(2);
  });

  it('does not fire wizard_step on render or when no navigation happens', () => {
    render(<WizardLayout steps={steps} currentStepIndex={1} onStepChange={vi.fn()} />);

    expect(mockTrackWizardStep).not.toHaveBeenCalled();
  });

  it('passes undefined context when none is provided so the hook applies fallbacks', () => {
    render(<WizardLayout steps={steps} currentStepIndex={1} onStepChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(mockTrackWizardStep).toHaveBeenCalledWith(3, 'function', undefined);
  });
});
