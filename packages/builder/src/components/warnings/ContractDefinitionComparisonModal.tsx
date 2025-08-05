import { AlertTriangle, Edit3, Minus, Plus } from 'lucide-react';
import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@openzeppelin/contracts-ui-builder-ui';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import type {
  ContractDefinitionComparisonResult,
  ContractDefinitionDifference,
} from './ContractDefinitionMismatchWarning';

/**
 * Props for the ContractDefinitionComparisonModal component
 */
export interface ContractDefinitionComparisonModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The comparison result to display */
  comparison: ContractDefinitionComparisonResult;
}

/**
 * Simple Badge component for internal use
 */
const SimpleBadge: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: 'outline' | 'secondary';
}> = ({ children, className = '', variant = 'outline' }) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border';
  const variantClasses =
    variant === 'outline'
      ? 'border-gray-300 text-gray-700 bg-white'
      : 'border-gray-200 text-gray-600 bg-gray-100';

  return <span className={cn(baseClasses, variantClasses, className)}>{children}</span>;
};

/**
 * Modal component for displaying detailed contract definition comparison
 * Shows all differences with expanded details, signatures, and impact analysis
 */
export const ContractDefinitionComparisonModal: React.FC<
  ContractDefinitionComparisonModalProps
> = ({ open, onClose, comparison }) => {
  // Group differences by section for better organization
  const groupedDifferences = comparison.differences.reduce(
    (acc, diff) => {
      if (!acc[diff.section]) {
        acc[diff.section] = [];
      }
      acc[diff.section].push(diff);
      return acc;
    },
    // Use Object.create(null) to avoid prototype pollution - ensures acc[section]
    // is always undefined or an array, never an inherited property from Object.prototype
    Object.create(null) as Record<string, ContractDefinitionDifference[]>
  );

  // Get icon for change type
  const getChangeIcon = (type: ContractDefinitionDifference['type']) => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified':
        return <Edit3 className="h-4 w-4 text-orange-600" />;
    }
  };

  // Get color for change type
  const getChangeColor = (type: ContractDefinitionDifference['type']) => {
    switch (type) {
      case 'added':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'removed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'modified':
        return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  // Get impact badge color
  const getImpactColor = (impact: ContractDefinitionDifference['impact']) => {
    switch (impact) {
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: ContractDefinitionComparisonResult['severity']) => {
    switch (severity) {
      case 'none':
        return 'text-gray-600';
      case 'minor':
        return 'text-yellow-600';
      case 'major':
        return 'text-orange-600';
      case 'breaking':
        return 'text-red-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Contract Definition Comparison
          </DialogTitle>
          <DialogDescription>
            Detailed analysis of differences between stored and current contract definitions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-8">
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Impact</span>
              <SimpleBadge
                variant="outline"
                className={cn(getSeverityColor(comparison.severity), 'font-medium')}
              >
                {comparison.severity.toUpperCase()}
              </SimpleBadge>
            </div>
            <p className="text-sm text-gray-600">{comparison.summary}</p>
            <div className="mt-3 text-xs text-gray-500">
              {comparison.differences.length} total change
              {comparison.differences.length !== 1 ? 's' : ''} detected
            </div>
          </div>

          {/* Changes by Section */}
          <Accordion type="multiple" defaultValue={Object.keys(groupedDifferences)} variant="card">
            {Object.entries(groupedDifferences).map(([section, differences]) => (
              <AccordionItem key={section} value={section}>
                <AccordionTrigger className="capitalize">
                  <div className="flex items-center gap-2">
                    <span>{section}s</span>
                    <SimpleBadge variant="secondary" className="text-xs">
                      {differences.length}
                    </SimpleBadge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {differences.map((diff, index) => (
                      <div
                        key={index}
                        className={cn('border rounded-lg p-4', getChangeColor(diff.type))}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getChangeIcon(diff.type)}
                            <span className="font-medium text-sm">{diff.name}</span>
                            <SimpleBadge
                              variant="outline"
                              className={cn('text-xs', getImpactColor(diff.impact))}
                            >
                              {diff.impact} impact
                            </SimpleBadge>
                          </div>
                          <SimpleBadge variant="outline" className="text-xs capitalize">
                            {diff.type}
                          </SimpleBadge>
                        </div>

                        <p className="text-sm mb-3">{diff.details}</p>

                        {/* Signature Comparison */}
                        {(diff.oldSignature || diff.newSignature) && (
                          <div className="space-y-2">
                            {diff.oldSignature && (
                              <div className="bg-white bg-opacity-50 p-3 rounded border">
                                <div className="text-xs font-medium text-gray-600 mb-1">
                                  Previous Definition
                                </div>
                                <code className="text-xs text-gray-800 break-all">
                                  {diff.oldSignature}
                                </code>
                              </div>
                            )}
                            {diff.newSignature && (
                              <div className="bg-white bg-opacity-50 p-3 rounded border">
                                <div className="text-xs font-medium text-gray-600 mb-1">
                                  Current Definition
                                </div>
                                <code className="text-xs text-gray-800 break-all">
                                  {diff.newSignature}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Help Text */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
            <p className="text-blue-800 mb-2">
              <strong>Understanding Impact Levels:</strong>
            </p>
            <ul className="text-blue-700 space-y-1 text-xs">
              <li>
                <strong>Low:</strong> Additions that maintain backward compatibility (e.g., new
                events)
              </li>
              <li>
                <strong>Medium:</strong> Additions that extend functionality (e.g., new functions)
              </li>
              <li>
                <strong>High:</strong> Changes or removals that may break existing integrations
              </li>
            </ul>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
