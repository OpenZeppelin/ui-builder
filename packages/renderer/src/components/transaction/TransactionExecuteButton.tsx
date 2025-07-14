import { ButtonProps, LoadingButton } from '@openzeppelin/contracts-ui-builder-ui';

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
}: TransactionExecuteButtonProps): React.ReactElement {
  return (
    <LoadingButton
      type="submit"
      disabled={!isWalletConnected || !isFormValid}
      loading={isSubmitting}
      variant={variant}
      size="lg"
      className="w-full md:w-auto"
    >
      {isSubmitting ? 'Executing...' : 'Execute Transaction'}
    </LoadingButton>
  );
}
