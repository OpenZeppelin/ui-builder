import type { ZkArtifact } from '../utils/zip-extractor';

/**
 * ZK Configuration shape expected by the proof provider
 */
interface ZKConfig {
  circuitId: string;
  proverKey: Uint8Array;
  verifierKey: Uint8Array;
  zkir: Uint8Array;
}

/**
 * A ZkConfigProvider that uses embedded ZK artifacts from contract ZIP files.
 * Works entirely in-browser without requiring any server endpoints.
 * 
 * This provider stores the prover/verifier keys and ZKIR files extracted from
 * the contract ZIP and provides them to the proof server when generating proofs.
 */
export class EmbeddedZkConfigProvider {
  constructor(private artifacts: Record<string, ZkArtifact> = {}) {}

  /**
   * Register ZK artifacts for a circuit
   */
  register(circuitId: string, artifact: ZkArtifact): void {
    this.artifacts[circuitId] = artifact;
  }

  /**
   * Register multiple ZK artifacts at once
   */
  registerAll(artifacts: Record<string, ZkArtifact>): void {
    this.artifacts = { ...this.artifacts, ...artifacts };
  }

  /**
   * Get ZK configuration for a specific circuit
   * This is called by the SDK when creating the proof server payload
   */
  async get(circuitId: string): Promise<ZKConfig | undefined> {
    const artifact = this.artifacts[circuitId];
    
    if (!artifact) {
      console.warn(
        `[EmbeddedZkConfigProvider] No artifacts found for circuit: ${circuitId}`,
        'Available circuits:',
        Object.keys(this.artifacts)
      );
      return undefined;
    }

    // Return the configuration in the format expected by the proof provider
    return {
      circuitId,
      proverKey: artifact.prover,
      verifierKey: artifact.verifier,
      zkir: artifact.zkir || new Uint8Array(0),
    };
  }

  /**
   * Get all registered circuit IDs
   */
  getCircuitIds(): string[] {
    return Object.keys(this.artifacts);
  }

  /**
   * Clear all registered artifacts
   */
  clear(): void {
    this.artifacts = {};
  }
}

