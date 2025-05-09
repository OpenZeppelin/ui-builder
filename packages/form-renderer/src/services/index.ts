/**
 * Services for the Form Renderer package.
 * @packageDocumentation
 */
import { AppConfigService } from './AppConfigService';

/**
 * Singleton instance of the AppConfigService.
 */
export const appConfigService = new AppConfigService();

// Re-export the class itself if direct instantiation is needed elsewhere,
// though the singleton instance is preferred.
export { AppConfigService };

export type { ConfigLoadStrategy } from './AppConfigService';
