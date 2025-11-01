import type { ContractFunction } from '@openzeppelin/ui-builder-types';
import { ButtonProps, LoadingButton } from '@openzeppelin/ui-builder-ui';

export interface TransactionExecuteButtonProps {
  /**
   * Whether the wallet is connected
   */
  isWalletConnected: boolean;

  /**
   * Whether a transaction is currently being submitted
   */
  isSubmitting: boolean;

  /**
   * Whether the form is valid
   */
  isFormValid: boolean;

  /**
   * Button variant
   */
  variant?: ButtonProps['variant'];

  /**
   * Optional function details to determine if local execution is possible
   * Functions with stateMutability === 'pure' can execute locally without wallet
   */
  functionDetails?: ContractFunction;

  /**
   * Whether this function can execute locally without wallet connection
   * If true, the wallet connection check is bypassed
   */
  canExecuteLocally?: boolean;
}

/**
 * TransactionExecuteButton Component
 *
 * Displays a button for executing a transaction, which is disabled if the wallet is not connected,
 * the form is invalid, or a transaction is currently being submitted.
 *
 * @param props The component props
 * @returns A React component
 */
export function TransactionExecuteButton({
  isWalletConnected,
  isSubmitting,
  isFormValid,
  variant = 'default',
  functionDetails,
  canExecuteLocally = false,
}: TransactionExecuteButtonProps): React.ReactElement {
  // Check if this function can execute locally (chain-agnostic check)
  // Prefer explicit prop, fallback to functionDetails if not provided
  const canExecute = canExecuteLocally || functionDetails?.stateMutability === 'pure';

  const buttonText = canExecute
    ? isSubmitting
      ? 'Executing...'
      : 'Execute Locally'
    : isSubmitting
      ? 'Executing...'
      : 'Execute Transaction';

  return (
    <LoadingButton
      type="submit"
      disabled={(!isWalletConnected && !canExecute) || !isFormValid}
      loading={isSubmitting}
      variant={variant}
      size="lg"
      className="w-full md:w-auto"
    >
      {buttonText}
    </LoadingButton>
  );
}
