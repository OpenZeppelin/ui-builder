# Analytics Feature Flag

This document explains how to use the analytics feature flag to control Google Analytics tracking in the UI Builder.

## Default Configuration

By default, analytics is **disabled** for privacy and development safety:

- **Analytics**: Disabled by default (`analytics_enabled: false`)

## Environment Variables

You can enable analytics using environment variables:

### Enable Analytics

```bash
# Enable Google Analytics tracking
VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED=true

# Set Google Analytics Tag ID (required when analytics is enabled)
VITE_GA_TAG_ID=G-XXXXXXXXXX

# Disable Google Analytics tracking (default)
VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED=false
```

**Important:** When analytics is enabled (`VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED=true`), you must also provide the Google Analytics Tag ID via `VITE_GA_TAG_ID`. Without this environment variable, the analytics service will not initialize properly.

## JSON Configuration

For the UI Builder application itself, you can use the `app.config.json` file:

```json
{
  "featureFlags": {
    "analytics_enabled": true
  }
}
```

**Note:** This analytics integration is only for the builder application itself, not for the exported applications that users generate. Exported applications are standalone React apps without analytics tracking.

## Use Cases

### Development Environment

During development, analytics should remain disabled:

```bash
# Default - no environment variable needed
# Analytics is disabled by default for privacy and development safety
```

### Staging Environment

For staging, you might want to test analytics:

```bash
# Enable analytics for testing
VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED=true

# Set staging-specific Google Analytics Tag ID
VITE_GA_TAG_ID=G-STAGING123  # Replace with your staging GA property ID
```

**Important:** Use a separate Google Analytics property for staging to avoid contaminating production analytics data.

### Production Environment

For production, analytics is typically enabled via CI/CD:

```bash
# Production deployment with analytics enabled
VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED=true

# Set production-specific Google Analytics Tag ID
VITE_GA_TAG_ID=G-PROD456  # Replace with your production GA property ID
```

**Best Practice:** Use environment-specific Google Analytics properties:

- Staging GA property for staging deployments (via `VITE_GA_TAG_ID_STAGING` GitHub secret)
- Production GA property for production deployments (via `VITE_GA_TAG_ID_PROD` GitHub secret)

## Implementation Details

The analytics feature flag controls:

1. **Google Analytics Script Loading**: Whether the gtag.js script is loaded
2. **Event Tracking**: Whether custom events are sent to Google Analytics
3. **User Privacy**: Ensures no tracking occurs in development by default

### Tracked Events

When analytics is enabled, the following user interactions **within the UI Builder** are tracked:

- **Ecosystem Selection**: When users select blockchain ecosystems (EVM, Solana, etc.) in the builder
- **Network Selection**: When users choose specific networks within ecosystems in the builder
- **Export Actions**: When users click the "Export" button to generate standalone applications
- **Wizard Progress**: Each step progression through the form builder wizard interface
- **Sidebar Interactions**: Import/Export button clicks in the storage sidebar of the builder

**Important:** These analytics only track user behavior within the builder tool itself. The standalone applications that users export do not contain any analytics tracking.

### Privacy Considerations

- Analytics is **disabled by default** to protect user privacy
- Only anonymous usage patterns **within the builder interface** are tracked
- No personal identifiable information (PII) is collected
- Users' contract data and form configurations are not tracked
- Analytics only applies to the builder tool - exported applications have no tracking whatsoever

## Environment Integration

### GitHub Actions

For production deployments, set the analytics flag in your GitHub Actions workflow:

```yaml
- name: Build with Analytics
  env:
    VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED: true
  run: pnpm build
```

### Docker

For containerized deployments:

```dockerfile
ENV VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED=true
```

## Testing

The analytics feature flag is fully tested in the AppConfigService test suite:

- Environment variable configuration
- JSON configuration
- Default disabled state
- Case insensitivity support

To run analytics feature flag tests:

```bash
cd packages/utils
pnpm test -- AppConfigService.test.ts
```

## Related Files

- **`AppConfigService.ts`**: Core feature flag implementation
- **`example.app.config.json`**: Example configuration with analytics flag
- **Test Files**: Comprehensive test coverage for analytics configuration
