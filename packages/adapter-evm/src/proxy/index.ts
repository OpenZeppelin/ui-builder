// Barrel file for proxy module
// Re-export all proxy functionality from core package
export {
  detectProxyFromAbi,
  getImplementationAddress,
  getAdminAddress,
  type ProxyDetectionResult,
} from '@openzeppelin/ui-builder-adapter-evm-core';
