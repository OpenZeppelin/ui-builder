import { JSX, useEffect, useMemo, useRef, useState } from 'react';

import type { ContractFunction } from '@openzeppelin/ui-builder-types';
import { cn } from '@openzeppelin/ui-builder-utils';

interface FunctionResultProps {
  functionDetails: ContractFunction;
  result?: string;
  loading: boolean;
}

/**
 * Component for displaying formatted function results (strings)
 */
export function FunctionResult({
  functionDetails,
  result,
  loading,
}: FunctionResultProps): JSX.Element {
  const formattedResult = result ?? '';
  const hasResult = typeof result === 'string';
  const isError = hasResult && (result.startsWith('Error:') || result.startsWith('[Error:'));

  const headerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<'xs' | '2xs'>('xs');
  const hasScaledDownRef = useRef(false);
  const lastContentRef = useRef<string>('');

  const outputs = useMemo(() => functionDetails.outputs || [], [functionDetails.outputs]);
  const currentContent = `${functionDetails.name}-${outputs.map((o) => o.type).join(',')}`;

  // Check if content overflows and adjust font size accordingly
  useEffect(() => {
    // Reset scaling state when content changes
    if (lastContentRef.current !== currentContent) {
      lastContentRef.current = currentContent;
      hasScaledDownRef.current = false;
      setFontSize('xs');
      return;
    }

    const checkOverflow = (): void => {
      if (!headerRef.current) return;

      const container = headerRef.current;
      const isOverflowing = container.scrollWidth > container.clientWidth;

      if (isOverflowing && fontSize === 'xs' && !hasScaledDownRef.current) {
        hasScaledDownRef.current = true;
        setFontSize('2xs');
      }
    };

    // Small delay to ensure rendering is complete
    const timeoutId = setTimeout(checkOverflow, 10);

    return (): void => {
      clearTimeout(timeoutId);
    };
  }, [functionDetails.name, outputs, fontSize, currentContent]);

  return (
    <div className="border rounded-sm p-2">
      <div
        ref={headerRef}
        className={cn(
          'font-medium mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 leading-tight overflow-hidden',
          fontSize === 'xs' ? 'text-xs' : 'text-[10px]'
        )}
      >
        <span className="flex-shrink-0 min-w-0 break-all">{functionDetails.name}</span>
        {outputs.length > 0 && (
          <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap">
            {`→ ${outputs.map((o) => o.type).join(', ')}`}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground italic animate-pulse">Loading...</div>
      ) : hasResult ? (
        <pre
          className={cn(
            'text-xs p-1 max-h-24 bg-muted overflow-auto rounded whitespace-pre-wrap break-all',
            'animate-fade-in',
            isError && 'text-destructive'
          )}
        >
          {formattedResult}
        </pre>
      ) : (
        <div className="text-xs text-muted-foreground italic">Click Refresh to fetch result</div>
      )}
    </div>
  );
}
