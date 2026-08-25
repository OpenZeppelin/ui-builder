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

When analytics is enabled, the following GA4 events are sent from **within the UI Builder**. All
events are fired from `src/hooks/useBuilderAnalytics.ts` (builder-specific) or the shared
`useAnalytics` hook from `@openzeppelin/ui-react` (`page_view`, `network_selected`).

Every string parameter is normalised to `"unknown"` when the value is missing or empty, so GA4
event-scoped custom dimensions are never dropped for lack of a value.

| Event                        | Parameters                                                        | Fires when                                                                                | Call site                                                         |
| ---------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `page_view`                  | `page_title`, `page_location` (GA defaults)                       | Once on initial load, automatically by `gtag('config')`. No manual `trackPageView` calls. | `AnalyticsProvider` in `App.tsx`                                  |
| `ecosystem_selected`         | `ecosystem`                                                       | User picks an ecosystem in the chain selector, or a deep link changes the ecosystem       | `ChainSelector.tsx`, `useBuilderLifecycle.ts`                     |
| `network_selected`           | `network_id`, `ecosystem`                                         | User picks a network, or a deep link resolves a network                                   | `ChainSelector.tsx`, `useBuilderLifecycle.ts`                     |
| `wizard_step`                | `step_number` (1-indexed), `step_name`, `network_id`, `ecosystem` | Once per Next/Back click; describes the step being entered                                | `Common/WizardLayout.tsx`                                         |
| `export_clicked`             | `export_type`, `network_id`, `ecosystem`                          | Once after an app export succeeds                                                         | `UIBuilder/hooks/useCompleteStepState.ts`                         |
| `sidebar_interaction`        | `action` (`import` \| `export`), `network_id`, `ecosystem`        | Once per sidebar Import/Export click                                                      | `Sidebar/AppSidebar/MainActions.tsx`                              |
| `transaction_executed`       | `network_id`, `ecosystem`, `execution_method`                     | A transaction succeeds from the form preview                                              | `StepFormCustomization/FormPreview.tsx`                           |
| `contract_ui_created`        | `network_id`, `ecosystem`, `total_records`                        | Once when a new Contract UI record is first persisted by auto-save                        | `UIBuilder/hooks/builder/useAutoSave.ts`                          |
| `relayer_service_configured` | `network_id`, `ecosystem`                                         | Once per mount when relayer URL, API key and relayer selection are all set                | `StepFormCustomization/components/RelayerConfiguration/index.tsx` |
| `uikit_changed`              | `network_id`, `ecosystem`, `uikit_name`                           | User selects a UI kit in builder settings                                                 | `StepFormCustomization/components/UiKitSettings.tsx`              |
| `address_book_opened`        | `network_id`, `ecosystem`                                         | Once when the address book dialog opens (not on network changes while open)               | `AddressBook/AddressBookDialog.tsx`                               |

GA4 event-scoped custom dimensions to register: `ecosystem`, `network_id`, `step_name`,
`step_number`, `export_type`, `action`, `execution_method`, `uikit_name`, `total_records`.

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
