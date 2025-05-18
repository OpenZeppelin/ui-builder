import React, { useEffect, useRef, useState } from 'react';

import { ContractAdapter } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

/**
 * Component that handles wallet network switching based on the selected network.
 *
 * This component is designed to be used in the FormBuilder itself rather than
 * in the general wallet UI to ensure it has direct access to the adapter.
 */

// Comments and local types referencing specific libraries (e.g., wagmi) should be avoided here.
// This component should rely on the generic facade hooks provided by the adapter.

// Helper to check if a value is an object and not null
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const NetworkSwitchManager: React.FC<{
  adapter: ContractAdapter;
  targetNetworkId: string;
  onNetworkSwitchComplete?: () => void;
}> = ({ adapter, targetNetworkId, onNetworkSwitchComplete }) => {
  const isMountedRef = useRef(true);
  const [hasAttemptedSwitch, setHasAttemptedSwitch] = useState(false);

  const facadeHooks = adapter.getEcosystemReactHooks?.();

  // --- useSwitchChain Facade Hook ---
  const switchChainHookOutput = facadeHooks?.useSwitchChain
    ? facadeHooks.useSwitchChain()
    : undefined;
  let execSwitchNetwork: ((args: { chainId: number }) => void) | undefined;
  let isSwitchingNetworkViaHook = false;
  let switchNetworkError: Error | null = null;

  if (isObject(switchChainHookOutput)) {
    if (
      'switchChain' in switchChainHookOutput &&
      typeof switchChainHookOutput.switchChain === 'function'
    ) {
      execSwitchNetwork = switchChainHookOutput.switchChain as (args: { chainId: number }) => void;
    }
    if (
      'isPending' in switchChainHookOutput &&
      typeof switchChainHookOutput.isPending === 'boolean'
    ) {
      isSwitchingNetworkViaHook = switchChainHookOutput.isPending;
    }
    if ('error' in switchChainHookOutput && switchChainHookOutput.error instanceof Error) {
      switchNetworkError = switchChainHookOutput.error;
    }
  }

  // --- useAccount Facade Hook ---
  const accountHookOutput = facadeHooks?.useAccount ? facadeHooks.useAccount() : undefined;
  let isConnected = false;
  let currentChainIdFromHook: number | undefined;

  if (isObject(accountHookOutput)) {
    if ('isConnected' in accountHookOutput && typeof accountHookOutput.isConnected === 'boolean') {
      isConnected = accountHookOutput.isConnected;
    }
    if ('chainId' in accountHookOutput && typeof accountHookOutput.chainId === 'number') {
      currentChainIdFromHook = accountHookOutput.chainId;
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    logger.info(
      'NetworkSwitchManager',
      `🔌 Mounted with target: ${targetNetworkId}, attempting switch: false`
    );
    setHasAttemptedSwitch(false);
    return () => {
      logger.info('NetworkSwitchManager', `🔌 Unmounting, was for target: ${targetNetworkId}`);
      isMountedRef.current = false;
    };
  }, [targetNetworkId]);

  useEffect(() => {
    logger.info('NetworkSwitchManager', '💡 State Update:', {
      target: targetNetworkId,
      adapter: adapter.networkConfig.id,
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
      completeOperation('No valid useSwitchChain hook. Operation complete.');
      return;
    }

    if (isSwitchingNetworkViaHook && hasAttemptedSwitch) {
      // If hook is pending AND we initiated this attempt, let completion effect handle it.
      logger.info(
        'NetworkSwitchManager',
        'Hook reports switch in progress (for current attempt). Waiting...'
      );
      return;
    }

    // If hasAttemptedSwitch is true here, but hook is NOT pending, means it completed/errored very fast.
    // The completion effect should pick this up.
    if (hasAttemptedSwitch && !isSwitchingNetworkViaHook) {
      logger.info(
        'NetworkSwitchManager',
        'Switch attempt concluded by hook state before timeout logic. Deferring to completion effect.'
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
      completeOperation('Wallet not connected (hook). Operation complete.');
      return;
    }

    if (!('chainId' in adapter.networkConfig)) {
      completeOperation('Target network config missing chainId. Operation complete.');
      return;
    }
    const targetChainToBeSwitchedTo = Number(adapter.networkConfig.chainId);

    if (currentChainIdFromHook === targetChainToBeSwitchedTo) {
      completeOperation('Already on correct chain (hook). Operation complete.');
      return;
    }

    const performSwitchActual = () => {
      if (!isMountedRef.current || isSwitchingNetworkViaHook || hasAttemptedSwitch) {
        // If hook became pending, or an attempt was already made and concluded, don't re-issue.
        logger.info(
          'NetworkSwitchManager',
          'Switch attempt aborted in timeout (state changed). Conditions: isSwitching: ${isSwitchingNetworkViaHook}, hasAttempted: ${hasAttemptedSwitch}'
        );
        return;
      }
      logger.info(
        'NetworkSwitchManager',
        `🚀 Attempting switch to ${targetChainToBeSwitchedTo} via hook.`
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
        logger.error('NetworkSwitchManager', 'Error from switch hook:', switchNetworkError);
        completionMessage = 'Switch hook completed with error.';
      } else {
        logger.info(
          'NetworkSwitchManager',
          'Switch hook completed successfully (no error reported by hook).'
        );
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
