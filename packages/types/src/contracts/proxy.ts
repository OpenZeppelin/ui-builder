/**
 * Proxy Contract Detection and Analysis Types
 *
 * These types support runtime proxy pattern detection and analysis.
 * Note: These are NOT persisted to storage - proxy information should be fresh on each load.
 */

/**
 * Chain-agnostic proxy contract detection information
 * Contains information about proxy pattern detection and implementation addresses
 */
export interface ProxyInfo {
  /** Whether the contract is detected as a proxy */
  isProxy: boolean;
  /** Type of proxy pattern detected (e.g., 'uups', 'transparent', 'beacon', 'diamond', 'minimal') */
  proxyType: string;
  /** Implementation contract address that contains the business logic */
  implementationAddress?: string;
  /** Admin address for admin-managed proxies (when determinable via storage slots) */
  adminAddress?: string;
  /** Original proxy contract address provided by the user */
  proxyAddress: string;
  /** Method used to detect the proxy pattern (e.g., 'abi-analysis', 'eip1967-storage', 'direct-call') */
  detectionMethod?: string;
  /** Confidence level of the proxy detection */
  confidence?: 'high' | 'medium' | 'low';
  /** When the proxy information was detected */
  detectionTimestamp?: Date;
  /** Error message if proxy detection failed */
  detectionError?: string;
}
