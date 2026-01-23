/**
 * Proxy Module
 *
 * Proxy contract detection and implementation resolution.
 *
 * @module proxy
 */

export {
  detectProxyFromAbi,
  getImplementationAddress,
  getAdminAddress,
  type ProxyDetectionResult,
} from './detection';
