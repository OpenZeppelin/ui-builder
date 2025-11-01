---
'@openzeppelin/ui-builder-types': minor
'@openzeppelin/ui-builder-ui': minor
'@openzeppelin/ui-builder-builder': minor
'@openzeppelin/ui-builder-renderer': minor
'@openzeppelin/ui-builder-adapter-midnight': minor
---

Implement runtime-only secret field support with dual-credential execution

- Add FunctionBadge, FunctionDecoration, and FunctionDecorationsMap types to types/adapters/ui-enhancements.ts
- Extend ContractAdapter.signAndBroadcast to accept optional runtimeApiKey and runtimeSecret parameters
- Add adapterBinding field to FormFieldType for adapter-specific credential binding
- Implement Banner component for reusable notification/warning display in ui package
- Add runtimeSecret field type with adapter-driven UI rendering in builder:
  - Hide "Field Type" dropdown for runtime secret fields
  - Hide "Required Field" toggle for runtime secret fields
  - Make "Field Label" span full width when Field Type is hidden
  - Add security warning banner when hardcoded values are used
- Extract runtime secret display logic into separate components (RuntimeSecretFieldDisplay, ParameterFieldDisplay)
- Extract field header (icon, label, delete button) into FieldHeader component
- Implement reusable hooks for function notes (useGetFunctionNote) and execution validation (useExecutionValidation)
- Create FunctionNoteSection and RuntimeSecretButton components for modular form customization
- Add runtimeSecretExtractor utility for clean credential handling during transaction execution
- Support hardcoded readonly runtime secrets with proper field extraction
- Implement FunctionDecorationsService in adapter-midnight for organizer-only circuit detection
- Fix private state overlay to handle provider storage misses gracefully
- Update transaction execution flow to pass both relayer API keys and adapter-specific secrets
