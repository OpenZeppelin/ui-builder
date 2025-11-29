import { describe, expect, it } from 'vitest';

import {
  detectOrganizerOnlyBySource,
  detectOrganizerOnlyCircuits,
} from '../organizer-only-detector';

describe('organizer-only-detector', () => {
  describe('detectOrganizerOnlyCircuits', () => {
    it('should identify circuits with state-modifying names and sensitive witnesses', () => {
      const circuitMap = {
        setName: {},
        getName: {},
        toggleOpen: {},
        updateDescription: {},
        increment: {},
      };

      const witnesses = {
        local_sk: () => {},
        get_local_alias: () => {},
      };

      const result = detectOrganizerOnlyCircuits(circuitMap, witnesses);

      expect(result.setName).toBe(true);
      expect(result.toggleOpen).toBe(true);
      expect(result.updateDescription).toBe(true);
      expect(result.getName).toBeUndefined();
      expect(result.increment).toBeUndefined();
    });

    it('should return empty results when no sensitive witnesses are present', () => {
      const circuitMap = {
        setName: {},
        getName: {},
        toggleOpen: {},
      };

      const witnesses = {
        get_local_alias: () => {},
        private_add: () => {},
      };

      const result = detectOrganizerOnlyCircuits(circuitMap, witnesses);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should not identify circuits without state-modifying prefixes', () => {
      const circuitMap = {
        getName: {},
        getDescription: {},
        increment: {},
        decrement: {},
      };

      const witnesses = {
        local_sk: () => {},
        set_owner_from_local_sk: () => {},
      };

      const result = detectOrganizerOnlyCircuits(circuitMap, witnesses);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle various state-modifying prefixes', () => {
      const circuitMap = {
        setName: {},
        toggleOpen: {},
        updateDescription: {},
        changeOwner: {},
        modifySettings: {},
        adminReset: {},
        registerUser: {},
        initializeState: {},
        configureOptions: {},
        manageAccess: {},
      };

      const witnesses = {
        local_sk: () => {},
      };

      const result = detectOrganizerOnlyCircuits(circuitMap, witnesses);

      expect(result.setName).toBe(true);
      expect(result.toggleOpen).toBe(true);
      expect(result.updateDescription).toBe(true);
      expect(result.changeOwner).toBe(true);
      expect(result.modifySettings).toBe(true);
      expect(result.adminReset).toBe(true);
      expect(result.registerUser).toBe(true);
      expect(result.initializeState).toBe(true);
      expect(result.configureOptions).toBe(true);
      expect(result.manageAccess).toBe(true);
    });

    it('should be case-insensitive for circuit names', () => {
      const circuitMap = {
        SetName: {},
        TOGGLE_OPEN: {},
        UpdateDescription: {},
      };

      const witnesses = {
        local_sk: () => {},
      };

      const result = detectOrganizerOnlyCircuits(circuitMap, witnesses);

      expect(result.SetName).toBe(true);
      expect(result.TOGGLE_OPEN).toBe(true);
      expect(result.UpdateDescription).toBe(true);
    });

    it('should detect any of the sensitive witnesses', () => {
      const circuitMap = {
        setName: {},
      };

      // Test with each sensitive witness individually
      const sensitiveWitnesses = [
        'local_sk',
        'set_owner_from_local_sk',
        'compute_commitment_with_secret',
        'check_pin',
      ];

      for (const witness of sensitiveWitnesses) {
        const witnesses = {
          [witness]: () => {},
          other_witness: () => {},
        };

        const result = detectOrganizerOnlyCircuits(circuitMap, witnesses);

        expect(result.setName).toBe(true);
      }
    });

    it('should handle empty circuit map', () => {
      const circuitMap = {};
      const witnesses = {
        local_sk: () => {},
      };

      const result = detectOrganizerOnlyCircuits(circuitMap, witnesses);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle empty witnesses', () => {
      const circuitMap = {
        setName: {},
        getName: {},
      };
      const witnesses = {};

      const result = detectOrganizerOnlyCircuits(circuitMap, witnesses);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('detectOrganizerOnlyBySource', () => {
    it('should detect direct witness calls', () => {
      const circuitMap = {
        setName: function (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          _context: unknown,
          _name: string
        ): unknown {
          return this.witnesses.local_sk(_context);
        },
        getName: function (this: { witnesses: unknown }, _context: unknown) {
          return 'name';
        },
      };

      const witnesses = {
        local_sk: () => {},
      };

      const result = detectOrganizerOnlyBySource(circuitMap, witnesses);

      expect(result.setName).toBe(true);
      expect(result.getName).toBeUndefined();
    });

    it('should detect destructured witness access', () => {
      const circuitMap = {
        setOwnerFromSk: function (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          context: unknown
        ): unknown {
          const { local_sk } = this.witnesses;
          const sk = local_sk(context);
          return sk;
        },
        getOwner: function (this: { witnesses: unknown }): string {
          return 'owner';
        },
      };

      const witnesses = {
        local_sk: () => {},
      };

      const result = detectOrganizerOnlyBySource(circuitMap, witnesses);

      expect(result.setOwnerFromSk).toBe(true);
      expect(result.getOwner).toBeUndefined();
    });

    it('should recognize all identity witness aliases', () => {
      const aliases = ['local_sk', 'local_secret_key', 'organizer_key', 'set_owner_from_local_sk'];

      for (const alias of aliases) {
        // Create a function with the witness call inline using the alias
        let circuitFn: (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          context: unknown
        ) => unknown;
        if (alias === 'local_sk') {
          circuitFn = function (
            this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
            context: unknown
          ): unknown {
            return this.witnesses.local_sk(context);
          };
        } else if (alias === 'local_secret_key') {
          circuitFn = function (
            this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
            context: unknown
          ): unknown {
            return this.witnesses.local_secret_key(context);
          };
        } else if (alias === 'organizer_key') {
          circuitFn = function (
            this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
            context: unknown
          ): unknown {
            return this.witnesses.organizer_key(context);
          };
        } else {
          // set_owner_from_local_sk
          circuitFn = function (
            this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
            context: unknown
          ): unknown {
            return this.witnesses.set_owner_from_local_sk(context);
          };
        }

        const circuitMap = {
          testCircuit: circuitFn,
        };

        const witnesses = {
          [alias]: () => {},
        };

        const result = detectOrganizerOnlyBySource(circuitMap, witnesses);

        expect(result.testCircuit).toBe(true);
      }
    });

    it('should not flag circuits that use non-identity witnesses', () => {
      const circuitMap = {
        checkPin: function (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          context: unknown,
          pin: number
        ): unknown {
          return this.witnesses.check_pin(context, pin);
        },
        getAlias: function (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          context: unknown
        ): unknown {
          return this.witnesses.get_local_alias(context);
        },
      };

      const witnesses = {
        check_pin: () => {},
        get_local_alias: () => {},
      };

      const result = detectOrganizerOnlyBySource(circuitMap, witnesses);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should return empty when no identity witnesses present', () => {
      const circuitMap = {
        setName: function (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          context: unknown
        ): unknown {
          return this.witnesses.check_pin(context, 1234);
        },
      };

      const witnesses = {
        check_pin: () => {},
        compute_commitment_with_secret: () => {},
      };

      const result = detectOrganizerOnlyBySource(circuitMap, witnesses);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle non-function circuit values gracefully', () => {
      const circuitMap = {
        realCircuit: function (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          context: unknown
        ): unknown {
          return this.witnesses.local_sk(context);
        },
        fakeCircuit: 'not a function',
        nullCircuit: null,
      };

      const witnesses = {
        local_sk: () => {},
      };

      const result = detectOrganizerOnlyBySource(circuitMap, witnesses);

      expect(result.realCircuit).toBe(true);
      expect(result.fakeCircuit).toBeUndefined();
      expect(result.nullCircuit).toBeUndefined();
    });

    it('should handle mixed direct and destructured patterns', () => {
      const circuitMap = {
        circuit1: function (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          context: unknown
        ): unknown {
          return this.witnesses.local_sk(context);
        },
        circuit2: function (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          context: unknown
        ): unknown {
          const { organizer_key } = this.witnesses;
          return organizer_key(context);
        },
        circuit3: function () {
          return 'pure';
        },
      };

      const witnesses = {
        local_sk: () => {},
        organizer_key: () => {},
      };

      const result = detectOrganizerOnlyBySource(circuitMap, witnesses);

      expect(result.circuit1).toBe(true);
      expect(result.circuit2).toBe(true);
      expect(result.circuit3).toBeUndefined();
    });

    it('should handle empty circuit map', () => {
      const circuitMap = {};
      const witnesses = {
        local_sk: () => {},
      };

      const result = detectOrganizerOnlyBySource(circuitMap, witnesses);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle empty witnesses', () => {
      const circuitMap = {
        setName: function (
          this: { witnesses: Record<string, (arg: unknown, ...rest: unknown[]) => unknown> },
          context: unknown
        ): unknown {
          return this.witnesses.local_sk(context);
        },
      };
      const witnesses = {};

      const result = detectOrganizerOnlyBySource(circuitMap, witnesses);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
