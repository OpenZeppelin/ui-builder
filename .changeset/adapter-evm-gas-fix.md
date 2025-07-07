---
'@openzeppelin/transaction-form-adapter-evm': patch
---

Fix default speed configuration not being applied on initial mount

Resolves bug where UI showed "Fast Speed Preset Active" but exported configuration used fallback gasPrice (20 gwei) instead of speed: 'fast'. Now ensures the default speed preset is properly communicated to the parent component and included in exported configurations.
