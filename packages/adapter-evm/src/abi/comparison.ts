/**
 * ABI comparison service for EVM contracts
 * Provides detailed analysis of differences between ABIs
 */

import type { Abi } from 'viem';

import { logger, simpleHash } from '@openzeppelin/ui-builder-utils';

import type { AbiComparisonResult, AbiDifference, AbiValidationResult } from './types';
import { isValidAbiArray } from './types';

/**
 * Service for comparing and validating EVM ABIs
 */
export class AbiComparisonService {
  /**
   * Compares two ABIs and returns detailed difference analysis
   */
  public compareAbis(abi1: string, abi2: string): AbiComparisonResult {
    try {
      const validation1 = this.validateAbi(abi1);
      const validation2 = this.validateAbi(abi2);

      if (!validation1.valid || !validation2.valid) {
        return {
          identical: false,
          differences: [],
          severity: 'breaking',
          summary: 'One or both ABIs are invalid and cannot be compared',
        };
      }

      const normalized1 = this.normalizeAbi(validation1.normalizedAbi!);
      const normalized2 = this.normalizeAbi(validation2.normalizedAbi!);

      const hash1 = simpleHash(JSON.stringify(normalized1));
      const hash2 = simpleHash(JSON.stringify(normalized2));

      if (hash1 === hash2) {
        return {
          identical: true,
          differences: [],
          severity: 'none',
          summary: 'ABIs are identical',
        };
      }

      const differences = this.findDifferences(normalized1, normalized2);
      const severity = this.calculateSeverity(differences);

      return {
        identical: false,
        differences,
        severity,
        summary: this.generateSummary(differences),
      };
    } catch (error) {
      logger.error('ABI comparison failed:', (error as Error).message);
      return {
        identical: false,
        differences: [],
        severity: 'breaking',
        summary: `Comparison failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validates ABI structure and format
   */
  public validateAbi(abiString: string): AbiValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse JSON
      const abi = JSON.parse(abiString);

      if (!Array.isArray(abi)) {
        errors.push('ABI must be an array');
        return { valid: false, errors, warnings };
      }

      // Empty ABI arrays are not valid contract definitions
      if (abi.length === 0) {
        errors.push(
          'ABI array cannot be empty - contract must have at least one function, event, or constructor'
        );
        return { valid: false, errors, warnings };
      }

      // Validate each ABI item
      for (let i = 0; i < abi.length; i++) {
        const item = abi[i];

        if (!item.type) {
          errors.push(`Item ${i}: Missing 'type' field`);
          continue;
        }

        if (
          !['function', 'event', 'constructor', 'error', 'fallback', 'receive'].includes(item.type)
        ) {
          errors.push(`Item ${i}: Invalid type '${item.type}'`);
        }

        if (item.type === 'function' && !item.name) {
          errors.push(`Item ${i}: Function missing 'name' field`);
        }

        if ((item.type === 'function' || item.type === 'event') && !Array.isArray(item.inputs)) {
          errors.push(`Item ${i}: Missing or invalid 'inputs' array`);
        }

        if (item.type === 'function' && !Array.isArray(item.outputs)) {
          warnings.push(`Item ${i}: Function missing 'outputs' array`);
        }
      }

      // Additional viem-specific validation
      if (errors.length === 0 && !isValidAbiArray(abi)) {
        errors.push('ABI does not conform to expected format');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        normalizedAbi: errors.length === 0 ? (abi as Abi) : undefined,
      };
    } catch (parseError) {
      errors.push(`Invalid JSON: ${(parseError as Error).message}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Creates deterministic hash of ABI for quick comparison
   */
  public hashAbi(abiString: string): string {
    try {
      const validation = this.validateAbi(abiString);
      if (!validation.valid || !validation.normalizedAbi) {
        throw new Error('Cannot hash invalid ABI');
      }

      const normalized = this.normalizeAbi(validation.normalizedAbi);
      const normalizedString = JSON.stringify(normalized);

      return simpleHash(normalizedString);
    } catch (error) {
      logger.error('ABI hashing failed:', (error as Error).message);
      throw new Error(`Failed to hash ABI: ${(error as Error).message}`);
    }
  }

  /**
   * Normalizes ABI for consistent comparison
   */
  private normalizeAbi(abi: Abi): Abi {
    return abi
      .map((item) => {
        // Remove ordering-dependent fields and sort inputs/outputs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalized: any = { ...item };

        if (normalized.inputs) {
          normalized.inputs = [...normalized.inputs].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          );
        }

        if (normalized.outputs) {
          normalized.outputs = [...normalized.outputs].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          );
        }

        return normalized;
      })
      .sort((a, b) => {
        // Sort by type first, then by name
        const typeOrder = {
          constructor: 0,
          fallback: 1,
          receive: 2,
          function: 3,
          event: 4,
          error: 5,
        };
        const aOrder = typeOrder[a.type as keyof typeof typeOrder] ?? 99;
        const bOrder = typeOrder[b.type as keyof typeof typeOrder] ?? 99;

        if (aOrder !== bOrder) return aOrder - bOrder;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aName = (a as any).name || '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bName = (b as any).name || '';
        return aName.localeCompare(bName);
      }) as Abi;
  }

  /**
   * Finds detailed differences between two normalized ABIs
   */
  private findDifferences(abi1: Abi, abi2: Abi): AbiDifference[] {
    const differences: AbiDifference[] = [];

    // Create maps for efficient lookup
    const map1 = this.createAbiMap(abi1);
    const map2 = this.createAbiMap(abi2);

    // Find removed items
    for (const [key, item] of map1) {
      if (!map2.has(key)) {
        differences.push({
          type: 'removed',
          section: item.type as AbiDifference['section'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (item as any).name || item.type,
          details: `${item.type} was removed`,
          impact: this.calculateImpact(item.type, 'removed'),
          oldSignature: this.generateSignature(item),
        });
      }
    }

    // Find added items
    for (const [key, item] of map2) {
      if (!map1.has(key)) {
        differences.push({
          type: 'added',
          section: item.type as AbiDifference['section'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (item as any).name || item.type,
          details: `${item.type} was added`,
          impact: this.calculateImpact(item.type, 'added'),
          newSignature: this.generateSignature(item),
        });
      }
    }

    // Find modified items
    for (const [key, item1] of map1) {
      const item2 = map2.get(key);
      if (item2 && !this.itemsEqual(item1, item2)) {
        differences.push({
          type: 'modified',
          section: item1.type as AbiDifference['section'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (item1 as any).name || item1.type,
          details: `${item1.type} signature changed`,
          impact: this.calculateImpact(item1.type, 'modified'),
          oldSignature: this.generateSignature(item1),
          newSignature: this.generateSignature(item2),
        });
      }
    }

    return differences;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createAbiMap(abi: Abi): Map<string, any> {
    const map = new Map();

    for (const item of abi) {
      const key = this.generateItemKey(item);
      map.set(key, item);
    }

    return map;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateItemKey(item: any): string {
    if (item.type === 'constructor' || item.type === 'fallback' || item.type === 'receive') {
      return item.type;
    }

    const name = item.name || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputs = item.inputs?.map((input: any) => input.type).join(',') || '';
    return `${item.type}:${name}(${inputs})`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateSignature(item: any): string {
    if (item.type === 'constructor') {
      const inputs =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item.inputs?.map((input: any) => `${input.type} ${input.name || ''}`).join(', ') || '';
      return `constructor(${inputs})`;
    }

    if (item.type === 'fallback' || item.type === 'receive') {
      return item.type + '()';
    }

    if (item.type === 'function') {
      const inputs =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item.inputs?.map((input: any) => `${input.type} ${input.name || ''}`).join(', ') || '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const outputs = item.outputs?.map((output: any) => output.type).join(', ') || '';
      const mutability = item.stateMutability ? ` ${item.stateMutability}` : '';
      return `function ${item.name}(${inputs})${mutability}${outputs ? ` returns (${outputs})` : ''}`;
    }

    if (item.type === 'event') {
      const inputs =
        item.inputs
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?.map((input: any) => {
            const indexed = input.indexed ? ' indexed' : '';
            return `${input.type}${indexed} ${input.name || ''}`;
          })
          .join(', ') || '';
      return `event ${item.name}(${inputs})`;
    }

    return JSON.stringify(item);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private itemsEqual(item1: any, item2: any): boolean {
    return JSON.stringify(item1) === JSON.stringify(item2);
  }

  private calculateImpact(
    type: string,
    changeType: 'added' | 'removed' | 'modified'
  ): 'low' | 'medium' | 'high' {
    if (type === 'constructor' || type === 'fallback' || type === 'receive') {
      return changeType === 'modified' ? 'high' : 'medium';
    }

    if (type === 'function') {
      if (changeType === 'removed') return 'high'; // Breaking: removes functionality
      if (changeType === 'modified') return 'medium'; // Major: changes behavior
      if (changeType === 'added') return 'low'; // Minor: adds functionality
    }

    if (type === 'event') {
      return 'low'; // Events don't break existing functionality
    }

    if (type === 'error') {
      return 'low'; // Custom errors don't break existing functionality
    }

    return 'medium';
  }

  private calculateSeverity(differences: AbiDifference[]): 'none' | 'minor' | 'major' | 'breaking' {
    if (differences.length === 0) return 'none';

    const hasHighImpact = differences.some((d) => d.impact === 'high');
    const hasMediumImpact = differences.some((d) => d.impact === 'medium');
    const hasRemovedFunctions = differences.some(
      (d) => d.type === 'removed' && d.section === 'function'
    );

    if (hasRemovedFunctions || hasHighImpact) return 'breaking';
    if (hasMediumImpact) return 'major';
    return 'minor';
  }

  private generateSummary(differences: AbiDifference[]): string {
    const counts = {
      added: differences.filter((d) => d.type === 'added').length,
      removed: differences.filter((d) => d.type === 'removed').length,
      modified: differences.filter((d) => d.type === 'modified').length,
    };

    const parts: string[] = [];
    if (counts.added > 0) parts.push(`${counts.added} added`);
    if (counts.removed > 0) parts.push(`${counts.removed} removed`);
    if (counts.modified > 0) parts.push(`${counts.modified} modified`);

    const summary = parts.join(', ');
    return `${summary}`;
  }
}

// Export singleton instance
export const abiComparisonService = new AbiComparisonService();
