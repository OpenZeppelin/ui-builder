import type { ProverKey, VerifierKey, ZKConfig, ZKIR } from '@midnight-ntwrk/midnight-js-types';
import { ZKConfigProvider as BaseZKConfigProvider } from '@midnight-ntwrk/midnight-js-types';

import type { ZkArtifact } from '../utils/zip-extractor';

/**
 * A ZkConfigProvider that uses embedded ZK artifacts from contract ZIP files.
 * Works entirely in-browser without requiring any server endpoints.
 *
 * This provider stores the prover/verifier keys and ZKIR files extracted from
 * the contract ZIP and provides them to the proof server when generating proofs.
 *
 * Extends the SDK's abstract ZKConfigProvider class to ensure type compatibility.
 */
export class EmbeddedZkConfigProvider extends BaseZKConfigProvider<string> {
  constructor(private artifacts: Record<string, ZkArtifact> = {}) {
    super();
  }

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
  override async get(circuitId: string): Promise<ZKConfig<string>> {
    const artifact = this.artifacts[circuitId];

    if (!artifact) {
      throw new Error(`No ZK artifacts found for circuit: ${circuitId}`);
    }

    // Return the configuration in the format expected by the proof provider
    return {
      circuitId,
      proverKey: artifact.prover,
      verifierKey: artifact.verifier,
      zkir: artifact.zkir || new Uint8Array(0),
    } as ZKConfig<string>;
  }

  /**
   * Retrieves the ZKIR for the given circuit
   */
  override async getZKIR(circuitId: string): Promise<ZKIR> {
    const artifact = this.artifacts[circuitId];
    if (!artifact) {
      throw new Error(`No ZK artifacts found for circuit: ${circuitId}`);
    }
    return (artifact.zkir || new Uint8Array(0)) as ZKIR;
  }

  /**
   * Retrieves the prover key for the given circuit
   */
  override async getProverKey(circuitId: string): Promise<ProverKey> {
    const artifact = this.artifacts[circuitId];
    if (!artifact) {
      throw new Error(`No ZK artifacts found for circuit: ${circuitId}`);
    }
    return artifact.prover as ProverKey;
  }

  /**
   * Retrieves the verifier key for the given circuit
   */
  override async getVerifierKey(circuitId: string): Promise<VerifierKey> {
    const artifact = this.artifacts[circuitId];
    if (!artifact) {
      throw new Error(`No ZK artifacts found for circuit: ${circuitId}`);
    }
    return artifact.verifier as VerifierKey;
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
