import { Download, Eye, Pencil } from 'lucide-react';

import React from 'react';

import { ContractActionBar } from '@openzeppelin/contracts-ui-builder-renderer';
import type { NetworkConfig } from '@openzeppelin/transaction-form-types';
import { Button, LoadingButton } from '@openzeppelin/transaction-form-ui';

interface ActionBarProps {
  network: NetworkConfig | null;
  contractAddress?: string | null;
  onToggleContractState?: () => void;
  isWidgetExpanded?: boolean;
  // Preview form functionality
  showPreviewButton?: boolean;
  isPreviewMode?: boolean;
  onTogglePreview?: () => void;
  // Export functionality
  showExportButton?: boolean;
  exportLoading?: boolean;
  onExport?: () => void;
}

/**
 * ActionBar - Extended action bar for the core form builder
 * Uses ContractActionBar as a base and adds core-specific actions (export, preview)
 */
export function ActionBar({
  network,
  contractAddress = null,
  onToggleContractState,
  isWidgetExpanded = false,
  showPreviewButton = false,
  isPreviewMode = false,
  onTogglePreview,
  showExportButton = false,
  exportLoading = false,
  onExport,
}: ActionBarProps): React.ReactElement | null {
  if (!network) return null;

  return (
    <ContractActionBar
      networkConfig={network}
      contractAddress={contractAddress}
      onToggleContractState={onToggleContractState}
      isWidgetExpanded={isWidgetExpanded}
    >
      {/* Core-specific actions */}
      {showExportButton && onExport && (
        <LoadingButton
          variant="default"
          size="sm"
          onClick={onExport}
          className="gap-2"
          loading={exportLoading}
        >
          <Download size={16} />
          <span>Export</span>
        </LoadingButton>
      )}

      {showPreviewButton && onTogglePreview && (
        <Button
          variant={isPreviewMode ? 'outline' : 'default'}
          size="sm"
          onClick={onTogglePreview}
          className="gap-2"
        >
          {isPreviewMode ? (
            <>
              <Pencil size={16} />
              <span>Back to Editor</span>
            </>
          ) : (
            <>
              <Eye size={16} />
              <span>Preview Form</span>
            </>
          )}
        </Button>
      )}
    </ContractActionBar>
  );
}
