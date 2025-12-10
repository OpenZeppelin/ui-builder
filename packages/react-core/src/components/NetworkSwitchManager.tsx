import React, { useEffect, useRef, useState } from 'react';

import { ContractAdapter } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { useDerivedAccountStatus } from '../hooks/useDerivedAccountStatus';
import { useDerivedSwitchChainStatus } from '../hooks/useDerivedSwitchChainStatus';

/**
 * Props for the NetworkSwitchManager component.
 */
export interface NetworkSwitchManagerProps {
  /** The adapter instance for the target network */
  adapter: ContractAdapter;
  /** The network ID we want to switch to */
  targetNetworkId: string;
  /** Callback when network switch completes (success or error) */
  onNetworkSwitchComplete?: () => void;
}

/**
 * Component that handles wallet network switching based on the selected network.
 *
 * This component manages the lifecycle of network switching operations,
 * coordinating between the wallet's current chain state and the target network.
 * It's designed to be used in any application that needs seamless wallet network switching.
 *
 * Features:
 * - Automatically initiates network switch when mounted with a target network
 * - Handles EVM chain switching gracefully
 * - No-ops for non-EVM networks that don't support chain switching
 * - Tracks switch attempts to prevent duplicate operations
 * - Provides completion callback for parent components to handle state cleanup
 */
export const NetworkSwitchManager: React.FC<NetworkSwitchManagerProps> = ({
  adapter,
  targetNetworkId,
  onNetworkSwitchComplete,
}) => {
  const isMountedRef = useRef(true);
  const [hasAttemptedSwitch, setHasAttemptedSwitch] = useState(false);

  const { isConnected, chainId: currentChainIdFromHook } = useDerivedAccountStatus();
  const {
    switchChain: execSwitchNetwork,
    isSwitching: isSwitchingNetworkViaHook,
    error: switchNetworkError,
  } = useDerivedSwitchChainStatus();

  useEffect(() => {
    isMountedRef.current = true;
    logger.info(
      'NetworkSwitchManager',
      `Mounted with target: ${targetNetworkId}, current attempt status: ${hasAttemptedSwitch}`
    );
    setHasAttemptedSwitch(false);
    return () => {
      logger.info('NetworkSwitchManager', `Unmounting, was for target: ${targetNetworkId}`);
      isMountedRef.current = false;
    };
    // hasAttemptedSwitch is intentionally omitted from deps: we only want to reset when targetNetworkId changes,
    // not when hasAttemptedSwitch itself changes (which would cause unnecessary re-renders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetNetworkId]);

  useEffect(() => {
    logger.info('NetworkSwitchManager', 'State Update:', {
      target: targetNetworkId,
      adapterNetwork: adapter.networkConfig.id,
      isSwitching: isSwitchingNetworkViaHook,
      hookError: !!switchNetworkError,
      canExec: !!execSwitchNetwork,
      connected: isConnected,
      walletChain: currentChainIdFromHook,
      attempted: hasAttemptedSwitch,
    });
  }, [
    adapter,
    targetNetworkId,
    isSwitchingNetworkViaHook,
    switchNetworkError,
    execSwitchNetwork,
    isConnected,
    currentChainIdFromHook,
    hasAttemptedSwitch,
  ]);

  // Main Orchestration & Pre-flight Effect
  useEffect(() => {
    const completeOperation = (
      logMessage?: string,
      options: { notifyComplete?: boolean } = { notifyComplete: true }
    ) => {
      if (logMessage) logger.info('NetworkSwitchManager', logMessage);
      if (options.notifyComplete && isMountedRef.current && onNetworkSwitchComplete)
        onNetworkSwitchComplete();
      if (isMountedRef.current) setHasAttemptedSwitch(false);
    };

    if (!execSwitchNetwork) {
      completeOperation('No switchChain function available from hook. Operation halted.', {
        notifyComplete: false,
      });
      return;
    }

    if (isSwitchingNetworkViaHook && hasAttemptedSwitch) {
      // If hook is pending AND we initiated this attempt, let completion effect handle it.
      logger.info(
        'NetworkSwitchManager',
        'Hook reports switch in progress for current attempt. Waiting...'
      );
      return;
    }

    // If hasAttemptedSwitch is true here, but hook is NOT pending, means it completed/errored very fast.
    // The completion effect should pick this up.
    if (hasAttemptedSwitch && !isSwitchingNetworkViaHook) {
      logger.info(
        'NetworkSwitchManager',
        'Previous switch attempt concluded. Deferring to completion effect.'
      );
      return;
    }

    // If we are here, no attempt has been made for the current targetNetworkId yet, or a previous attempt on a *different* target completed.
    // OR, the hook is not pending from a previous unrelated call.
    // Reset attempt flag for a fresh try if it was from a different context/target.
    // Note: setHasAttemptedSwitch(false) is in mount effect for targetNetworkId change.

    // === Pre-flight checks for the current targetNetworkId ===
    if (adapter.networkConfig.id !== targetNetworkId) {
      completeOperation(
        `CRITICAL: Adapter (${adapter.networkConfig.id}) vs Target (${targetNetworkId}) mismatch. Operation halted.`,
        {
          notifyComplete: false,
        }
      );
      return;
    }
    if (!isConnected) {
      completeOperation('Wallet not connected (derived status). Awaiting connection.', {
        notifyComplete: false,
      });
      return;
    }
    if (!('chainId' in adapter.networkConfig)) {
      completeOperation(
        'Network does not support chain switching (non-EVM). Operation complete (no-op).'
      );
      return;
    }
    const targetChainToBeSwitchedTo = Number(adapter.networkConfig.chainId);
    if (currentChainIdFromHook === targetChainToBeSwitchedTo) {
      completeOperation('Already on correct chain (derived status). Operation complete.');
      return;
    }

    const performSwitchActual = () => {
      if (!isMountedRef.current || isSwitchingNetworkViaHook || hasAttemptedSwitch) {
        // If hook became pending, or an attempt was already made and concluded, don't re-issue.
        logger.info(
          'NetworkSwitchManager',
          `Switch attempt aborted in timeout or already handled. Conditions: isSwitching: ${isSwitchingNetworkViaHook}, hasAttempted: ${hasAttemptedSwitch}`
        );
        return;
      }
      logger.info(
        'NetworkSwitchManager',
        `Attempting switch to ${targetChainToBeSwitchedTo} via derived hook.`
      );
      setHasAttemptedSwitch(true); // Mark that this specific attempt for this target is now starting
      execSwitchNetwork({ chainId: targetChainToBeSwitchedTo });
    };

    const timeoutId = setTimeout(performSwitchActual, 100);
    return () => clearTimeout(timeoutId);
  }, [
    adapter,
    targetNetworkId,
    execSwitchNetwork,
    isSwitchingNetworkViaHook,
    onNetworkSwitchComplete,
    isConnected,
    currentChainIdFromHook,
    hasAttemptedSwitch,
  ]);

  // Completion/Error Effect (handles outcomes of an initiated execSwitchNetwork call)
  useEffect(() => {
    if (!isMountedRef.current || !execSwitchNetwork || !hasAttemptedSwitch) return;

    // Only act if the hook is NOT pending AND an attempt was made
    if (!isSwitchingNetworkViaHook) {
      let completionMessage = 'Switch hook operation concluded.';
      if (switchNetworkError) {
        logger.error('NetworkSwitchManager', 'Error from derived switch hook:', switchNetworkError);
        completionMessage = 'Switch hook completed with error.';
      } else {
        logger.info('NetworkSwitchManager', 'Derived switch hook completed successfully.');
      }
      if (onNetworkSwitchComplete) onNetworkSwitchComplete();
      if (isMountedRef.current) setHasAttemptedSwitch(false);
      logger.info('NetworkSwitchManager', completionMessage);
    }
  }, [
    isSwitchingNetworkViaHook,
    switchNetworkError,
    execSwitchNetwork,
    hasAttemptedSwitch,
    onNetworkSwitchComplete,
  ]);

  return null;
};
