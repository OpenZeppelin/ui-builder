import React, { useEffect, useRef, useState } from 'react';

import { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import {
  useDerivedAccountStatus,
  useDerivedSwitchChainStatus,
} from '@openzeppelin/transaction-form-react-core';

/**
 * Component that handles wallet network switching based on the selected network.
 *
 * This component is designed to be used in the FormBuilder itself rather than
 * in the general wallet UI to ensure it has direct access to the adapter.
 */

// Comments and local types referencing specific libraries (e.g., wagmi) should be avoided here.
// This component should rely on the generic facade hooks provided by the adapter.

export const NetworkSwitchManager: React.FC<{
  adapter: ContractAdapter;
  targetNetworkId: string;
  onNetworkSwitchComplete?: () => void;
}> = ({ adapter, targetNetworkId, onNetworkSwitchComplete }) => {
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
      `🔌 Mounted with target: ${targetNetworkId}, current attempt status: ${hasAttemptedSwitch}`
    );
    setHasAttemptedSwitch(false);
    return () => {
      logger.info('NetworkSwitchManager', `🔌 Unmounting, was for target: ${targetNetworkId}`);
      isMountedRef.current = false;
    };
  }, [targetNetworkId, hasAttemptedSwitch]);

  useEffect(() => {
    logger.info('NetworkSwitchManager', '💡 State Update:', {
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
    const completeOperation = (logMessage?: string) => {
      if (logMessage) logger.info('NetworkSwitchManager', logMessage);
      if (isMountedRef.current && onNetworkSwitchComplete) onNetworkSwitchComplete();
      if (isMountedRef.current) setHasAttemptedSwitch(false);
    };

    if (!execSwitchNetwork) {
      completeOperation('No switchChain function available from hook. Operation complete.');
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
        `CRITICAL: Adapter (${adapter.networkConfig.id}) vs Target (${targetNetworkId}) mismatch. Operation complete.`
      );
      return;
    }
    if (!isConnected) {
      completeOperation('Wallet not connected (derived status). Operation complete.');
      return;
    }
    if (!('chainId' in adapter.networkConfig)) {
      completeOperation('Target network config missing chainId. Operation complete.');
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
        `🚀 Attempting switch to ${targetChainToBeSwitchedTo} via derived hook.`
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
