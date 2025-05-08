import { Download, Eye, Pencil } from 'lucide-react';

import React from 'react';

import { Button, LoadingButton } from '@openzeppelin/transaction-form-renderer';
import type { NetworkConfig } from '@openzeppelin/transaction-form-types';

import { NetworkStatusBadge } from './NetworkStatusBadge';
import { ViewContractStateButton } from './ViewContractStateButton';

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
    <div className="bg-background border-b mb-6 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <NetworkStatusBadge network={network} />
        {contractAddress && onToggleContractState && !isWidgetExpanded && (
          <ViewContractStateButton
            contractAddress={contractAddress}
            onToggle={onToggleContractState}
          />
        )}
      </div>

      <div className="flex gap-2">
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
      </div>
    </div>
  );
}
