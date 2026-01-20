import { AlertTriangle } from 'lucide-react';
import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  Button,
} from '@openzeppelin/ui-components';
import { cn } from '@openzeppelin/ui-utils';

/**
 * Contract definition difference item (for comparing raw ABI, IDL, etc.)
 */
export interface ContractDefinitionDifference {
  type: 'added' | 'removed' | 'modified';
  section: string;
  name: string;
  details: string;
  impact: 'low' | 'medium' | 'high';
  oldSignature?: string;
  newSignature?: string;
}

/**
 * Contract definition comparison result (for comparing raw ABI, IDL, etc.)
 */
export interface ContractDefinitionComparisonResult {
  identical: boolean;
  differences: ContractDefinitionDifference[];
  severity: 'none' | 'minor' | 'major' | 'breaking';
  summary: string;
}

/**
 * Props for the ContractDefinitionMismatchWarning component
 */
export interface ContractDefinitionMismatchWarningProps {
  /** The comparison result showing differences */
  comparison: ContractDefinitionComparisonResult;
  /** Whether the warning is dismissible */
  dismissible?: boolean;
  /**
   * Callback when the warning is dismissed permanently.
   * This should update the baseline contract definition to accept the current state.
   */
  onDismiss?: () => void;
  /** Callback to view full comparison details */
  onViewDetails?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Warning component for displaying contract definition mismatches
 * Shows a collapsible summary of differences with severity-based styling
 */
export const ContractDefinitionMismatchWarning: React.FC<
  ContractDefinitionMismatchWarningProps
> = ({ comparison, dismissible = true, onDismiss, onViewDetails, className }) => {
  // Don't render if schemas are identical
  if (comparison.identical) {
    return null;
  }

  // Determine alert styling based on severity
  const alertVariant = comparison.severity === 'breaking' ? 'destructive' : 'default';

  const severityColor = {
    minor: 'text-yellow-600',
    major: 'text-orange-600',
    breaking: 'text-red-600',
    none: 'text-gray-600',
  }[comparison.severity];

  return (
    <Alert variant={alertVariant} className={cn('border-l-4', className)}>
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <AlertDescription>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-sm">Contract Definition Mismatch Detected</h4>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                comparison.severity === 'breaking'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              )}
            >
              {comparison.severity}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <span className={severityColor}>
              {comparison.differences.length} difference
              {comparison.differences.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {comparison.differences.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details" className="border-none">
                <AccordionTrigger className="text-xs text-gray-600 hover:text-gray-800 p-0 h-auto font-normal hover:no-underline">
                  Show Details
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {comparison.differences.slice(0, 5).map((diff, index) => (
                      <div key={index} className="text-xs p-3 rounded-md bg-gray-50 border">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              'inline-flex items-center rounded px-1 py-0 text-xs font-medium',
                              diff.type === 'removed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {diff.type}
                          </span>
                          <span className="font-mono text-gray-700 font-medium">{diff.name}</span>
                          <span className="inline-flex items-center rounded border px-1 py-0 text-xs">
                            {diff.impact}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-2">{diff.details}</p>

                        {diff.oldSignature && (
                          <div className="text-xs text-gray-500 mb-1">
                            <span className="text-red-600 font-medium">- </span>
                            <code className="bg-red-50 px-1 rounded">{diff.oldSignature}</code>
                          </div>
                        )}
                        {diff.newSignature && (
                          <div className="text-xs text-gray-500">
                            <span className="text-green-600 font-medium">+ </span>
                            <code className="bg-green-50 px-1 rounded">{diff.newSignature}</code>
                          </div>
                        )}
                      </div>
                    ))}

                    {comparison.differences.length > 5 && (
                      <div className="text-xs text-gray-500 text-center py-2 border-t">
                        ... and {comparison.differences.length - 5} more changes
                        {onViewDetails && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={onViewDetails}
                            className="text-xs ml-2 p-0 h-auto"
                          >
                            View all
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {dismissible && onDismiss && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Permanently accept changes:</strong> Dismissing this warning will update
                your saved configuration to use the current contract definition as the new baseline.
                Future comparisons will be made against this version.
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails} className="text-xs">
                View Full Comparison
              </Button>
            )}
            {dismissible && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-xs text-gray-600 hover:text-gray-800"
                title="Accept current contract definition as the new baseline. This action cannot be undone."
              >
                Accept Changes & Dismiss
              </Button>
            )}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};
