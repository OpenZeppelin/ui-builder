import type { ContractUIRecord } from '../../../storage';
import type { uiBuilderStore } from '../hooks/uiBuilderStore';

/**
 * Centralized criteria for determining if content is "meaningful"
 *
 * "Meaningful content" means the user has progressed beyond just selecting a network.
 * This requires at least one of:
 * - A contract address (user has specified what contract to interact with)
 * - A loaded contract schema (contract definition has been loaded)
 * - A selected function (user has chosen which function to call)
 * - Form configuration (user has customized the form)
 *
 * Network selection alone is NOT considered meaningful content, as it's just the first step
 * in the wizard and doesn't represent any actual work or configuration.
 */

/**
 * Checks if the current UI builder state has meaningful content.
 * Used for auto-save decisions and navigation behavior.
 *
 * @param state - The current UI builder state
 * @returns true if there is meaningful content, false otherwise
 */
export function hasMeaningfulContent(state: ReturnType<typeof uiBuilderStore.getState>): boolean {
  return !!(
    state.contractState.address ||
    state.contractState.schema ||
    state.selectedFunction ||
    state.formConfig
  );
}

/**
 * Checks if a saved contract UI record has meaningful content.
 * Used for displaying/filtering saved records in the UI.
 *
 * Special cases:
 * - Manually renamed records are always considered meaningful (user took explicit action)
 * - Checks the persisted record structure rather than current builder state
 *
 * @param record - The saved contract UI record to check
 * @returns true if the record has meaningful content, false otherwise
 */
export function recordHasMeaningfulContent(record: ContractUIRecord): boolean {
  // If manually renamed, always consider it meaningful
  if (record.metadata?.isManuallyRenamed === true) {
    return true;
  }

  // Check for meaningful content using the same criteria as the builder state
  // Map from record structure to the same logical checks
  const hasContent =
    Boolean(record.contractAddress) || // Maps to contractState.address
    Boolean(record.contractDefinition) || // Maps to contractState.schema (has loaded definition)
    Boolean(record.functionId) || // Maps to selectedFunction
    Boolean(record.formConfig?.fields && record.formConfig.fields.length > 0); // Maps to formConfig

  return hasContent;
}
