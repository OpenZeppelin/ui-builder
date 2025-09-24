/**
 * Step indices for the UIBuilder wizard navigation.
 * These must match the order of steps in the wizard.
 */
export const STEP_INDICES = {
  CHAIN_SELECT: 0,
  CONTRACT_DEFINITION: 1,
  FUNCTION_SELECTOR: 2,
  FORM_CUSTOMIZATION: 3,
  COMPLETE: 4,
} as const;

export type StepIndex = (typeof STEP_INDICES)[keyof typeof STEP_INDICES];
