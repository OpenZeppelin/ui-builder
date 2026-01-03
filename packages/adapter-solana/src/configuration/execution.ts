import type { ExecutionConfig, ExecutionMethodDetail } from '@openzeppelin/ui-types';

// Placeholders
export async function getSolanaSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
  return [{ type: 'eoa', name: 'EOA', description: 'Placeholder' }];
}
export async function validateSolanaExecutionConfig(
  _config: ExecutionConfig
): Promise<true | string> {
  return true;
}
