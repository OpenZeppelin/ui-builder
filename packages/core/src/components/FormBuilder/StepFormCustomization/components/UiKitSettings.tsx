import CodeEditor from '@uiw/react-textarea-code-editor';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { DynamicFormField } from '@openzeppelin/transaction-form-renderer';
import {
  AvailableUiKit,
  ContractAdapter,
  FormFieldType,
  FormValues,
  UiKitConfiguration,
  UiKitName,
} from '@openzeppelin/transaction-form-types';
import { ExternalLink } from '@openzeppelin/transaction-form-ui';
import { logger } from '@openzeppelin/transaction-form-utils';

import { OptionSelector, SelectableOption } from '../../../Common/OptionSelector';
import { TitledSection } from '../../../Common/TitledSection';

interface UiKitSettingsProps {
  adapter: ContractAdapter;
  onUpdateConfig: (config: UiKitConfiguration) => void;
  currentConfig?: UiKitConfiguration;
}

interface UiKitOption extends SelectableOption {
  configFields: FormFieldType[];
  name: string;
}

export function UiKitSettings({ adapter, onUpdateConfig, currentConfig }: UiKitSettingsProps) {
  const [availableKits, setAvailableKits] = useState<AvailableUiKit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<UiKitName | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState<string>('');

  const { control, getValues, reset } = useForm<FormValues>({
    defaultValues: currentConfig?.kitConfig || {},
    mode: 'onChange',
  });

  useEffect(() => {
    async function fetchKits() {
      if (!adapter) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const kits = await adapter.getAvailableUiKits();
        setAvailableKits(kits);

        // Set default selection
        const defaultKitId: UiKitName | null =
          currentConfig?.kitName || (kits.length > 0 ? (kits[0].id as UiKitName) : null);
        setSelectedKitId(defaultKitId);

        // Reset form with current config
        if (currentConfig?.kitConfig) {
          reset(currentConfig.kitConfig);
        }

        const selectedKitData = kits.find((k) => k.id === defaultKitId);
        if (currentConfig?.customCode && selectedKitData?.hasCodeEditor) {
          setCustomCode(currentConfig.customCode);
        } else if (selectedKitData?.defaultCode) {
          setCustomCode(selectedKitData.defaultCode);
        } else {
          setCustomCode('');
        }
      } catch (error) {
        logger.error('UiKitSettings', 'Failed to fetch available UI kits:', error);
        setErrorMessage('Failed to load available UI kits. Please try again.');
        setAvailableKits([]);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchKits();
  }, [adapter, currentConfig, reset]);

  const selectedKit = availableKits.find((kit) => kit.id === selectedKitId);

  // Transform available kits to selector options
  const selectorOptions: UiKitOption[] = availableKits.map((kit) => ({
    id: kit.id,
    label: kit.name,
    configFields: kit.configFields,
    name: kit.name,
  }));

  // Generate configuration content for the selected kit
  const configContent = selectedKit ? (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h4 className="text-base font-medium flex-1 min-w-0 truncate">
          {selectedKit.name} Configuration
        </h4>
        {selectedKit.linkToDocs && (
          <ExternalLink href={selectedKit.linkToDocs} className="text-sm flex-shrink-0">
            View Docs
          </ExternalLink>
        )}
      </div>

      {selectedKit.configFields.length > 0 && (
        <div className="space-y-4">
          {selectedKit.configFields.map((field) => (
            <div key={field.id} className="pt-2">
              <DynamicFormField field={field} control={control} adapter={adapter} />
            </div>
          ))}
        </div>
      )}

      {!selectedKit.hasCodeEditor && selectedKit.configFields.length === 0 && (
        <div className="py-4">
          <p className="text-muted-foreground text-sm">
            This UI kit requires no additional configuration.
          </p>
        </div>
      )}

      {selectedKit.hasCodeEditor && (
        <div className={selectedKit.configFields.length === 0 ? '' : 'pt-4'}>
          {selectedKit.description && (
            <p
              className="text-muted-foreground text-sm mb-4"
              dangerouslySetInnerHTML={{ __html: selectedKit.description }}
            />
          )}
          <CodeEditor
            value={customCode}
            language="typescript"
            placeholder="Enter your custom configuration code here."
            onChange={(e) => {
              const newCode = e.target.value;
              setCustomCode(newCode);

              // Update configuration with custom code
              // Parent component will handle separating runtime vs export config
              if (selectedKitId) {
                const formValues = getValues();
                const kit = availableKits.find((k) => k.id === selectedKitId);
                if (kit?.hasCodeEditor) {
                  onUpdateConfig({
                    kitName: selectedKitId,
                    kitConfig: formValues,
                    customCode: newCode,
                  });
                }
              }
            }}
            padding={15}
            style={{
              fontSize: 12,
              backgroundColor: '#f5f5f5',
              fontFamily:
                'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
              borderRadius: '0.25rem',
              border: '1px solid #e2e8f0',
              minHeight: '300px',
            }}
            data-color-mode="light"
          />
          <p className="text-muted-foreground text-xs mt-2">
            💡 Changes are saved automatically as you type.
          </p>
        </div>
      )}
    </div>
  ) : undefined;

  return (
    <TitledSection
      title="UI Kit Selection"
      description="Choose a wallet connection UI kit and configure its settings for your form."
      isAvailable={!!adapter}
      errorMessage={errorMessage}
      unavailableMessage="No blockchain adapter selected."
    >
      <OptionSelector
        options={selectorOptions}
        selectedId={selectedKitId}
        onSelect={(id) => {
          setSelectedKitId(id as UiKitName);
          const kit = availableKits.find((k) => k.id === id);
          const newCode = kit?.defaultCode || '';
          setCustomCode(newCode);

          // Update configuration immediately when kit is selected
          const formValues = getValues();
          const newConfig: UiKitConfiguration = {
            kitName: id as UiKitName,
            kitConfig: formValues,
            customCode: kit?.hasCodeEditor ? newCode : undefined,
          };

          onUpdateConfig(newConfig);
        }}
        configContent={configContent}
        isLoading={isLoading}
        loadingMessage="Loading available UI kits..."
        emptyMessage="No UI kits available for this adapter."
      />
    </TitledSection>
  );
}
