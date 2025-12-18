---
'@openzeppelin/ui-builder-adapter-stellar': patch
---

Fix: Read user-configured indexer endpoints from localStorage

The StellarIndexerClient now correctly reads user-configured indexer endpoints from UserNetworkServiceConfigService (localStorage). Previously, user settings saved via the NetworkSettingsDialog were ignored.

Changes:

- Add user-configured indexer as highest priority in endpoint resolution
- Add URL validation for user-configured endpoints
- Subscribe to config changes to reset cache when user updates settings
- Add dispose() method for cleanup
