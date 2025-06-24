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
import { Button, ExternalLink } from '@openzeppelin/transaction-form-ui';
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
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        const defaultKitId = currentConfig?.kitName || (kits.length > 0 ? kits[0].id : null);
        setSelectedKitId(defaultKitId);

        // Reset form with current config
        if (currentConfig?.kitConfig) {
          reset(currentConfig.kitConfig);
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

  const isUiKitName = (id: string): id is UiKitName => {
    return ['rainbowkit', 'connectkit', 'appkit', 'custom', 'none'].includes(id);
  };

  const handleApply = () => {
    if (!selectedKitId || !isUiKitName(selectedKitId)) return;
    const formValues = getValues();
    onUpdateConfig({ kitName: selectedKitId, kitConfig: formValues });
  };

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
      <div className="flex items-center justify-between">
        <h4 className="text-base font-medium">{selectedKit.name} Configuration</h4>
        {selectedKit.linkToDocs && (
          <ExternalLink href={selectedKit.linkToDocs} className="text-sm">
            View Docs
          </ExternalLink>
        )}
      </div>

      {selectedKit.configFields.length > 0 ? (
        <div className="space-y-4">
          {selectedKit.configFields.map((field) => (
            <div key={field.id} className="pt-2">
              <DynamicFormField field={field} control={control} adapter={adapter} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4">
          <p className="text-muted-foreground text-sm">
            This UI kit requires no additional configuration.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleApply}>Apply Configuration</Button>
      </div>
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
        onSelect={setSelectedKitId}
        configContent={configContent}
        isLoading={isLoading}
        loadingMessage="Loading available UI kits..."
        emptyMessage="No UI kits available for this adapter."
      />
    </TitledSection>
  );
}
