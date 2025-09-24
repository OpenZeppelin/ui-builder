import type { ContractUIRecord } from '@openzeppelin/ui-builder-storage';

/**
 * Determines if a saved contract UI record has meaningful content.
 *
 * @param record - The saved contract UI record to check
 * @returns true if the record has meaningful content, false otherwise
 */
export function recordHasMeaningfulContent(record: ContractUIRecord): boolean {
  // If manually renamed, always consider it meaningful
  if (record.metadata?.isManuallyRenamed === true) {
    return true;
  }

  // Check for meaningful content
  const hasContent =
    Boolean(record.networkId) ||
    Boolean(record.contractAddress) ||
    Boolean(record.functionId) ||
    Boolean(record.formConfig.fields && record.formConfig.fields.length > 0);

  return hasContent;
}
