/**
 * Utility functions for environment detection
 */

/**
 * Check if the application is running in development or test environment
 * @returns True if NODE_ENV is 'development' or 'test'
 */
export function isDevelopmentOrTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

/**
 * Check if the application is running in production environment
 * @returns True if NODE_ENV is 'production'
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}
