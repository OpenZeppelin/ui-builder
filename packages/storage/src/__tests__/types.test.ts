/**
 * Tests for types and interface validation
 */
import { describe, expect, it } from 'vitest';

import type { BaseRecord, ContractUIExportData, ContractUIRecord } from '../types';
import { createEmptyContractUIRecord, createMockContractUIRecord } from './setup';

describe('Types', () => {
  describe('BaseRecord', () => {
    it('should have required base fields', () => {
      const baseRecord: BaseRecord = {
        id: 'test-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(baseRecord.id).toBeDefined();
      expect(baseRecord.createdAt).toBeInstanceOf(Date);
      expect(baseRecord.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('ContractUIRecord', () => {
    it('should extend BaseRecord with all required fields', () => {
      const contractUIRecord = createMockContractUIRecord();

      // Check BaseRecord fields
      expect(contractUIRecord.id).toBeDefined();
      expect(contractUIRecord.createdAt).toBeInstanceOf(Date);
      expect(contractUIRecord.updatedAt).toBeInstanceOf(Date);

      // Check ContractUIRecord specific fields
      expect(typeof contractUIRecord.title).toBe('string');
      expect(typeof contractUIRecord.ecosystem).toBe('string');
      expect(typeof contractUIRecord.networkId).toBe('string');
      expect(typeof contractUIRecord.contractAddress).toBe('string');
      expect(typeof contractUIRecord.functionId).toBe('string');
      expect(typeof contractUIRecord.formConfig).toBe('object');
      expect(contractUIRecord.formConfig).not.toBeNull();
    });

    it('should have optional fields that can be undefined', () => {
      const contractUIRecord: ContractUIRecord = {
        ...createMockContractUIRecord(),
        executionConfig: undefined,
        uiKitConfig: undefined,
        metadata: undefined,
      };

      expect(contractUIRecord.executionConfig).toBeUndefined();
      expect(contractUIRecord.uiKitConfig).toBeUndefined();
      expect(contractUIRecord.metadata).toBeUndefined();
    });

    it('should allow optional fields to be present', () => {
      const contractUIRecord: ContractUIRecord = {
        ...createMockContractUIRecord(),
        executionConfig: { method: 'eoa', allowAny: true },
        uiKitConfig: { kitName: 'custom', kitConfig: {} },
        metadata: { isDraft: false, customField: 'value' },
      };

      expect(contractUIRecord.executionConfig).toEqual({ method: 'eoa', allowAny: true });
      expect(contractUIRecord.uiKitConfig).toEqual({ kitName: 'custom', kitConfig: {} });
      expect(contractUIRecord.metadata).toEqual({ isDraft: false, customField: 'value' });
    });

    it('should support empty/draft records', () => {
      const emptyRecord = createEmptyContractUIRecord();

      expect(emptyRecord.contractAddress).toBe('');
      expect(emptyRecord.functionId).toBe('');
      expect(emptyRecord.formConfig.fields).toEqual([]);
      expect(emptyRecord.metadata?.isDraft).toBe(true);
      expect(emptyRecord.metadata?.isManuallyRenamed).toBe(false);
    });

    it('should have valid form config structure', () => {
      const contractUIRecord = createMockContractUIRecord();
      const { formConfig } = contractUIRecord;

      expect(typeof formConfig.id).toBe('string');
      expect(typeof formConfig.title).toBe('string');
      expect(typeof formConfig.functionId).toBe('string');
      expect(typeof formConfig.contractAddress).toBe('string');
      expect(Array.isArray(formConfig.fields)).toBe(true);
      expect(typeof formConfig.layout).toBe('object');
      expect(typeof formConfig.validation).toBe('object');
      expect(typeof formConfig.submitButton).toBe('object');
      expect(typeof formConfig.theme).toBe('object');
      expect(typeof formConfig.description).toBe('string');
    });

    it('should have properly typed form config layout', () => {
      const contractUIRecord = createMockContractUIRecord();
      const { layout } = contractUIRecord.formConfig;

      expect(typeof layout.columns).toBe('number');
      expect(['normal', 'compact', 'spacious']).toContain(layout.spacing);
      expect(['top', 'left', 'inline']).toContain(layout.labelPosition);
    });

    it('should have properly typed form config validation', () => {
      const contractUIRecord = createMockContractUIRecord();
      const { validation } = contractUIRecord.formConfig;

      expect(['onChange', 'onBlur', 'onSubmit']).toContain(validation.mode);
      expect(['inline', 'summary', 'toast']).toContain(validation.showErrors);
    });

    it('should have properly typed submit button config', () => {
      const contractUIRecord = createMockContractUIRecord();
      const { submitButton } = contractUIRecord.formConfig;

      expect(typeof submitButton.text).toBe('string');
      expect(typeof submitButton.loadingText).toBe('string');
    });
  });

  describe('ContractUIExportData', () => {
    it('should have required structure for export data', () => {
      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations: [createMockContractUIRecord()],
      };

      expect(typeof exportData.version).toBe('string');
      expect(typeof exportData.exportedAt).toBe('string');
      expect(Array.isArray(exportData.configurations)).toBe(true);
      expect(exportData.configurations.length).toBeGreaterThan(0);
    });

    it('should accept empty configurations array', () => {
      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations: [],
      };

      expect(exportData.configurations).toEqual([]);
    });

    it('should validate export data timestamp format', () => {
      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations: [],
      };

      // Should be a valid ISO string
      expect(() => new Date(exportData.exportedAt)).not.toThrow();
      expect(exportData.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should support multiple configurations in export', () => {
      const config1 = createMockContractUIRecord({ title: 'Config 1' });
      const config2 = createMockContractUIRecord({ title: 'Config 2' });

      const exportData: ContractUIExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configurations: [config1, config2],
      };

      expect(exportData.configurations).toHaveLength(2);
      expect(exportData.configurations[0].title).toBe('Config 1');
      expect(exportData.configurations[1].title).toBe('Config 2');
    });
  });

  describe('Type compatibility', () => {
    it('should allow ContractUIRecord to be used as BaseRecord', () => {
      const contractUIRecord = createMockContractUIRecord();

      // This should compile without type errors
      const baseRecord: BaseRecord = contractUIRecord;

      expect(baseRecord.id).toBe(contractUIRecord.id);
      expect(baseRecord.createdAt).toBe(contractUIRecord.createdAt);
      expect(baseRecord.updatedAt).toBe(contractUIRecord.updatedAt);
    });

    it('should support partial updates with correct typing', () => {
      // This tests that Partial<ContractUIRecord> works correctly
      const partialUpdate: Partial<ContractUIRecord> = {
        title: 'Updated Title',
        metadata: { isManuallyRenamed: true },
      };

      expect(partialUpdate.title).toBe('Updated Title');
      expect(partialUpdate.metadata?.isManuallyRenamed).toBe(true);
      expect(partialUpdate.contractAddress).toBeUndefined();
    });

    it('should support omit types for record creation', () => {
      // This tests the type used in save operations
      const recordData: Omit<ContractUIRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'New UI',
        ecosystem: 'evm',
        networkId: '1',
        contractAddress: '0x123',
        functionId: 'transfer',
        formConfig: {
          id: 'form-id',
          title: 'Form Title',
          functionId: 'transfer',
          contractAddress: '0x123',
          fields: [],
          layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
          validation: { mode: 'onChange', showErrors: 'inline' },
          submitButton: { text: 'Submit', loadingText: 'Processing...' },
          theme: {},
          description: '',
        },
      };

      expect(recordData.title).toBe('New UI');
      expect(recordData.ecosystem).toBe('evm');
      // These fields should not exist in the type
      expect('id' in recordData).toBe(false);
      expect('createdAt' in recordData).toBe(false);
      expect('updatedAt' in recordData).toBe(false);
    });
  });

  describe('Metadata handling', () => {
    it('should support flexible metadata structure', () => {
      const record: ContractUIRecord = {
        ...createMockContractUIRecord(),
        metadata: {
          isDraft: true,
          isManuallyRenamed: false,
          customField: 'custom value',
          nested: {
            level: 2,
            data: [1, 2, 3],
          },
        },
      };

      expect(record.metadata?.isDraft).toBe(true);
      expect(record.metadata?.isManuallyRenamed).toBe(false);
      expect(record.metadata?.customField).toBe('custom value');
      expect(record.metadata?.nested).toEqual({ level: 2, data: [1, 2, 3] });
    });

    it('should allow metadata to be undefined', () => {
      const record: ContractUIRecord = {
        ...createMockContractUIRecord(),
        metadata: undefined,
      };

      expect(record.metadata).toBeUndefined();
    });
  });
});
