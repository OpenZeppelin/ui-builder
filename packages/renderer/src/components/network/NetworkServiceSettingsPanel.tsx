'use client';

import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { Control, useForm } from 'react-hook-form';

import type {
  ContractAdapter,
  FormValues,
  NetworkServiceForm,
} from '@openzeppelin/ui-builder-types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
} from '@openzeppelin/ui-builder-ui';
import {
  logger,
  sanitizeHtml,
  userNetworkServiceConfigService,
} from '@openzeppelin/ui-builder-utils';

import { DynamicFormField } from '../DynamicFormField';

interface Props {
  adapter: ContractAdapter;
  networkId: string;
  service: NetworkServiceForm;
  onSettingsChanged?: () => void;
}

export function NetworkServiceSettingsPanel({
  adapter,
  networkId,
  service,
  onSettingsChanged,
}: Props): JSX.Element {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { isDirty },
  } = useForm<FormValues>({ defaultValues: {} });
  const fields = useMemo(() => service.fields, [service]);
  const primaryFields = useMemo(
    () => fields.filter((f) => !(f.metadata as Record<string, unknown> | undefined)?.section),
    [fields]
  );
  const sectionGroups = useMemo(() => {
    const groups: Record<string, { label?: string; help?: string; fields: typeof fields }> =
      {} as never;
    for (const f of fields) {
      const md = (f.metadata as Record<string, unknown> | undefined) || {};
      const section = typeof md.section === 'string' ? (md.section as string) : undefined;
      if (!section) continue;
      if (!groups[section]) {
        groups[section] = {
          label: typeof md.sectionLabel === 'string' ? (md.sectionLabel as string) : undefined,
          help: typeof md.sectionHelp === 'string' ? (md.sectionHelp as string) : undefined,
          fields: [],
        };
      }
      // Update label/help if not already set and this field has them
      if (!groups[section]!.label && typeof md.sectionLabel === 'string') {
        groups[section]!.label = md.sectionLabel as string;
      }
      if (!groups[section]!.help && typeof md.sectionHelp === 'string') {
        groups[section]!.help = md.sectionHelp as string;
      }
      groups[section]!.fields.push(f);
    }
    return groups;
  }, [fields]);

  // Load existing saved values
  useEffect(() => {
    try {
      const existing = userNetworkServiceConfigService.get(networkId, service.id);
      if (existing && typeof existing === 'object') {
        for (const f of fields) {
          const v = (existing as Record<string, unknown>)[f.name];
          if (v !== undefined) setValue(f.name, v as never);
        }
      }

      // Seed adapter-provided defaults for any fields that remain unset
      for (const f of fields) {
        const current = (getValues() as Record<string, unknown>)[f.name];
        const hasValue = current !== undefined && current !== null && current !== '';
        if (!hasValue && 'defaultValue' in f && f.defaultValue !== undefined) {
          setValue(f.name, f.defaultValue as never);
        }
      }
    } catch (e) {
      logger.error('NetworkServiceSettingsPanel', 'Error loading config', e);
    }
  }, [networkId, service.id, fields, setValue, getValues]);

  const testConnection = useCallback(async () => {
    if (!adapter.testNetworkServiceConnection) return;
    setIsTesting(true);
    setResult(null);
    try {
      const data = getValues() as unknown as Record<string, unknown>;
      const r = await adapter.testNetworkServiceConnection(service.id, data);
      setResult({
        success: r.success,
        message: r.error || (r.success ? 'Connection successful' : 'Connection failed'),
        latencyMs: r.latency,
      });
    } catch (e) {
      setResult({
        success: false,
        message: e instanceof Error ? e.message : 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  }, [adapter, service.id, getValues]);

  const onSubmit = useCallback(
    async (formData: FormValues) => {
      const data = formData as unknown as Record<string, unknown>;
      if (adapter.validateNetworkServiceConfig) {
        const ok = await adapter.validateNetworkServiceConfig(service.id, data);
        if (!ok) {
          setResult({ success: false, message: 'Invalid configuration' });
          return;
        }
      }
      const nonEmpty = Object.values(data).some((v) => v !== undefined && v !== null && v !== '');
      if (nonEmpty) {
        userNetworkServiceConfigService.save(networkId, service.id, data);
      } else {
        userNetworkServiceConfigService.clear(networkId, service.id);
      }

      onSettingsChanged?.();
      setResult({ success: true, message: 'Settings saved successfully' });
    },
    [adapter, networkId, service.id, onSettingsChanged]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {service.description && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="text-sm">{service.label}</AlertTitle>
          <AlertDescription className="space-y-1 text-xs">
            <p className="mt-2">{service.description}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Adapter-provided informational notes */}
      {fields.filter((f) => (f.metadata as Record<string, unknown> | undefined)?.note).length >
        0 && (
        <div className="space-y-4">
          {fields
            .filter((f) => (f.metadata as Record<string, unknown> | undefined)?.note)
            .map((f) => {
              const note = (f.metadata as Record<string, unknown> | undefined)?.note as
                | { variant?: 'info' | 'warning'; title?: string; lines?: string[]; html?: boolean }
                | undefined;
              const isWarning = note?.variant === 'warning';
              const Icon = isWarning ? AlertTriangle : Info;
              return (
                <Alert key={f.id}>
                  <Icon className="h-4 w-4" />
                  {note?.title && <AlertTitle className="text-sm">{note.title}</AlertTitle>}
                  {note?.lines && note.lines.length > 0 && (
                    <AlertDescription className="space-y-1 text-xs">
                      {note.lines.map((ln, idx) =>
                        note.html ? (
                          <p key={idx} dangerouslySetInnerHTML={{ __html: sanitizeHtml(ln) }} />
                        ) : (
                          <p key={idx}>{ln}</p>
                        )
                      )}
                    </AlertDescription>
                  )}
                </Alert>
              );
            })}
        </div>
      )}

      {/* Primary, ungrouped fields */}
      {primaryFields.length > 0 && (
        <div className="space-y-4">
          {primaryFields.map((field) => (
            <DynamicFormField
              key={field.id}
              field={field}
              control={control as unknown as Control<FormValues>}
              adapter={adapter}
            />
          ))}
        </div>
      )}

      {/* Advanced, adapter-defined section groups */}
      {Object.keys(sectionGroups).length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced-settings" className="border rounded-md">
            <AccordionTrigger className="text-sm font-medium px-3 py-2 hover:no-underline">
              Advanced Settings
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-4">
              <div className="space-y-6 pt-2">
                {Object.entries(sectionGroups).map(([sectionId, group]) => (
                  <div key={sectionId}>
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-foreground">
                        {group.label ||
                          sectionId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </h4>
                      {group.help && (
                        <p className="text-xs text-muted-foreground mt-1">{group.help}</p>
                      )}
                    </div>
                    <div className="space-y-4">
                      {group.fields.map((field) => {
                        const md = (field.metadata as Record<string, unknown> | undefined) || {};
                        const indentUnder =
                          typeof md['nestUnder'] === 'string'
                            ? (md['nestUnder'] as string)
                            : undefined;
                        const disabledWhen = md['disabledWhen'] as
                          | { field: string; equals?: unknown; notEquals?: unknown }
                          | undefined;
                        let isDisabled = false;
                        if (disabledWhen && typeof disabledWhen.field === 'string') {
                          const depVal = watch(disabledWhen.field);
                          if ('equals' in disabledWhen) isDisabled = depVal === disabledWhen.equals;
                          else if ('notEquals' in disabledWhen)
                            isDisabled = depVal !== disabledWhen.notEquals;
                        }
                        const wrappedField = { ...field, readOnly: isDisabled } as typeof field;
                        return (
                          <div key={field.id} className={indentUnder ? 'ml-6' : ''}>
                            <DynamicFormField
                              field={wrappedField}
                              control={control as unknown as Control<FormValues>}
                              adapter={adapter}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {result && (
        <div
          className={`flex items-center gap-2 text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}
        >
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span>{result.message}</span>
          {result.latencyMs && (
            <span className="text-muted-foreground">({result.latencyMs}ms)</span>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Reset to default
            for (const f of fields) setValue(f.name, undefined as never);
            userNetworkServiceConfigService.clear(networkId, service.id);
            setResult(null);
            onSettingsChanged?.();
          }}
        >
          Reset to Default
        </Button>
        {((): boolean => {
          // Check if service explicitly disables connection testing
          if (service.supportsConnectionTest === false) {
            return false;
          }
          // Allow adapters to hide the test button by setting a field metadata flag
          const hideTest = fields.some((f) => {
            const md = f.metadata as Record<string, unknown> | undefined;
            return (md?.hideTestConnection as boolean) === true;
          });
          return Boolean(adapter.testNetworkServiceConnection) && !hideTest;
        })() ? (
          <Button type="button" variant="outline" onClick={testConnection} disabled={isTesting}>
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        ) : null}
        <Button type="submit" disabled={!isDirty}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
