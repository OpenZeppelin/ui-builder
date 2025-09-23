import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import React from 'react';
import { Control } from 'react-hook-form';

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PasswordField,
  UrlField,
} from '@openzeppelin/ui-builder-ui';

import type { ExecutionMethodFormData } from '../../../types';

interface RelayerFormData {
  relayerServiceUrl: string;
  sessionApiKey: string;
  selectedRelayer: string;
}

interface RelayerCredentialsCardProps {
  isActive: boolean;
  isComplete: boolean;
  relayerServiceUrl: string;
  sessionApiKey: string;
  isLoading: boolean;
  error: string | null;
  control: Control<ExecutionMethodFormData>;
  localControl: Control<RelayerFormData>;
  onFetchRelayers: () => void;
  onEdit: () => void;
}

export function RelayerCredentialsCard({
  isActive,
  isComplete,
  relayerServiceUrl,
  sessionApiKey,
  isLoading,
  error,
  control,
  localControl,
  onFetchRelayers,
  onEdit,
}: RelayerCredentialsCardProps): React.ReactElement {
  return (
    <Card className={!isActive && isComplete ? 'opacity-60' : ''}>
      <CardHeader className="pb-1 pt-2 px-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-1.5">
            {isComplete && (
              <div className="rounded p-0.5 bg-green-100 text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
            )}
            <CardTitle className="text-base">Connect to Relayer Service</CardTitle>
          </div>
          {isComplete && !isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="self-center sm:self-auto mt-1 sm:mt-0"
            >
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      {(isActive || !isComplete) && (
        <CardContent className="space-y-3 pt-0">
          <div className="w-full">
            <UrlField
              id="relayer-service-url"
              label="Relayer Service URL"
              name="relayerServiceUrl"
              control={control}
              validation={{ required: true }}
              placeholder="https://your-relayer.openzeppelin.com"
              helperText="Base URL of your OpenZeppelin Relayer service instance"
            />
          </div>

          <div className="w-full">
            <PasswordField
              id="relayer-api-key"
              label="API Key"
              name="sessionApiKey"
              control={localControl}
              validation={{ required: true }}
              placeholder="Enter your API key"
              helperText="Session-only authentication key (not persisted)"
            />
          </div>

          <div className="w-full">
            <Button
              onClick={onFetchRelayers}
              disabled={isLoading || !sessionApiKey || !relayerServiceUrl}
              type="button"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching relayers...
                </>
              ) : (
                'Fetch Available Relayers'
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="break-words">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
}
