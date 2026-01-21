# Ecosystem Feature Flags

This document explains how to use ecosystem feature flags to control which blockchain ecosystems are available in the UI Builder.

## Default Configuration

By default, the feature flags are configured as follows:

- **EVM**: Enabled and fully functional
- **Solana**: Disabled with "Coming Soon" placeholder
- **Stellar**: Disabled with "Coming Soon" placeholder
- **Midnight**: Disabled with "Coming Soon" placeholder

## Environment Variables

You can override the default behavior using environment variables:

### Enable/Disable Ecosystems

```bash
# Enable Solana ecosystem
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_SOLANA_ENABLED=true

# Enable Stellar ecosystem
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_STELLAR_ENABLED=true

# Enable Midnight ecosystem
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_MIDNIGHT_ENABLED=true

# Disable EVM ecosystem (not recommended)
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_EVM_ENABLED=false
```

### Show/Hide Ecosystems in UI

```bash
# Hide Solana from the UI completely
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_SOLANA_HIDE_IN_UI=true

# Hide Stellar from the UI completely
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_STELLAR_HIDE_IN_UI=true

# Hide Midnight from the UI completely
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_MIDNIGHT_HIDE_IN_UI=true
```

## JSON Configuration

For exported applications, you can use the `app.config.json` file:

```json
{
  "featureFlags": {
    "ecosystem_solana_enabled": true,
    "ecosystem_stellar_enabled": true,
    "ecosystem_midnight_enabled": true,
    "ecosystem_solana_hide_in_ui": false,
    "ecosystem_stellar_hide_in_ui": false,
    "ecosystem_midnight_hide_in_ui": false
  }
}
```

## Use Cases

### Development Phase

During development, you might want to enable specific ecosystems:

```bash
# Enable only EVM and Solana for testing
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_SOLANA_ENABLED=true
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_STELLAR_HIDE_IN_UI=true
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_MIDNIGHT_HIDE_IN_UI=true
```

### Production Release

For production, you might want to show "Coming Soon" placeholders:

```bash
# Show all ecosystems but only enable EVM
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_SOLANA_ENABLED=false
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_STELLAR_ENABLED=false
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_MIDNIGHT_ENABLED=false
```

### Complete Ecosystem Rollout

When an ecosystem is fully ready:

```bash
# Enable Solana completely
VITE_APP_CFG_FEATURE_FLAG_ECOSYSTEM_SOLANA_ENABLED=true
```

## Implementation Details

The feature flags are implemented using:

1. **`ecosystem-feature-flags.ts`**: Utility functions for checking ecosystem availability
2. **`ChainSelector.tsx`**: Updated to respect feature flags and show placeholders
3. **`AppConfigService`**: Existing feature flag infrastructure

The system automatically falls back to the first available enabled ecosystem if the initial ecosystem is disabled.
