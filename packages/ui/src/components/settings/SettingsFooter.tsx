'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface FooterResult {
  type: 'success' | 'error';
  message: string;
  extra?: string;
}

interface SettingsFooterProps {
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  result?: FooterResult | null;
  extraActions?: ReactNode;
}

export function SettingsFooter({
  onPrimary,
  onSecondary,
  primaryLabel = 'Save Settings',
  secondaryLabel = 'Reset to Default',
  disabled = false,
  loading = false,
  result,
  extraActions,
}: SettingsFooterProps): JSX.Element {
  return (
    <div className="space-y-3">
      {result && (
        <div
          className={`flex items-center gap-2 text-sm ${
            result.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {result.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>{result.message}</span>
          {result.extra && <span className="text-muted-foreground">({result.extra})</span>}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" onClick={onPrimary} disabled={disabled || loading}>
          {loading ? 'Saving...' : primaryLabel}
        </Button>
        {onSecondary && (
          <Button type="button" variant="outline" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
        {extraActions}
      </div>
    </div>
  );
}
