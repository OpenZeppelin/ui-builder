---
'@openzeppelin/ui-builder-adapter-midnight': minor
'@openzeppelin/ui-builder-app': patch
'@openzeppelin/ui-builder-storage': patch
'@openzeppelin/ui-builder-utils': patch
'@openzeppelin/ui-builder-ui': patch
---

Midnight adapter contract ingestion and shared gating

- Midnight: move loading to contract/loader; return contractDefinitionArtifacts; keep adapter thin.
- Builder: replace local required-field gating with shared utils (getMissingRequiredContractInputs); remove redundant helper.
- Utils: add contractInputs shared helpers and tests.
- Storage/App/UI: persist and rehydrate contractDefinitionArtifacts; auto-save triggers on artifact changes.
