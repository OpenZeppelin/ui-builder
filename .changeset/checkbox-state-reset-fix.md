---
'@openzeppelin/transaction-form-core': patch
---

Fix checkbox state reset when switching between fields

Resolved issue where checkbox states were not properly reset when switching between different fields in the FieldEditor. Added proper state management in fieldEditorUtils to ensure clean state transitions.
