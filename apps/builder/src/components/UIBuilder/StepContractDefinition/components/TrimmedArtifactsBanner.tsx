import { AlertCircle, ArrowRight } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle, Button } from '@openzeppelin/ui-components';

interface TrimmedArtifactsBannerProps {
  /** The name of the adapter (e.g., "Midnight") */
  adapterName?: string;
  /** Callback to navigate back to the saved function */
  onViewSavedFunction?: () => void;
}

/**
 * Banner shown when artifacts have been trimmed for a specific function.
 * Informs the user that switching functions requires re-uploading the original ZIP.
 */
export function TrimmedArtifactsBanner({
  adapterName = 'Contract',
  onViewSavedFunction,
}: TrimmedArtifactsBannerProps) {
  return (
    <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Artifacts Optimized for Current Function
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <p className="mb-2">
          This configuration was optimized for a specific function and contains only the necessary
          artifacts for that function.
        </p>
        <p className="text-sm mb-3">
          <strong>To switch to a different function:</strong> Re-upload the original {adapterName}{' '}
          artifacts ZIP file below. This will restore all functions and allow you to select a new
          one.
        </p>
        {onViewSavedFunction && (
          <Button
            onClick={onViewSavedFunction}
            variant="default"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            View Saved Function
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
