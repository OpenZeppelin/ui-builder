import { logger } from '@openzeppelin/contracts-ui-builder-utils';

/**
 * Global state for auto-save operations
 * Prevents race conditions and duplicate operations across hook instances
 */
let autoSaveInProgress = false;
let autoSavePaused = false;
let autoSaveTimer: number | NodeJS.Timeout | null = null;
let skipNextCycle = false;

/**
 * Acquire lock for auto-save operation
 * Returns true if lock was acquired, false if already in progress
 */
export function acquireAutoSaveLock(): boolean {
  if (autoSaveInProgress) {
    return false;
  }
  autoSaveInProgress = true;
  return true;
}

/**
 * Release the auto-save lock
 */
export function releaseAutoSaveLock(): void {
  autoSaveInProgress = false;
}

/**
 * Pause auto-save operations and clear any pending timers
 */
export function pauseAutoSave(): void {
  logger.info('builder', 'Auto-save paused');
  autoSavePaused = true;
  clearAutoSaveTimer();
}

/**
 * Resume auto-save operations
 * Sets flag to skip next cycle to prevent immediate save
 */
export function resumeAutoSave(): void {
  logger.info('builder', 'Auto-save resumed');
  autoSavePaused = false;
  skipNextCycle = true;
}

/**
 * Check if auto-save is currently paused
 */
export function isAutoSavePaused(): boolean {
  return autoSavePaused;
}

/**
 * Check if should skip current cycle
 * Returns true if should skip, automatically resets flag
 */
export function shouldSkipAutoSaveCycle(): boolean {
  if (skipNextCycle) {
    logger.info('builder', 'Skipping auto-save cycle - just resumed from load');
    skipNextCycle = false;
    return true;
  }
  return false;
}

/**
 * Clear any existing timer with proper cleanup for both timeout types
 */
export function clearAutoSaveTimer(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
    logger.info('builder', 'Cleared existing auto-save timer');
  }
}

/**
 * Set a new timer with proper handling for both requestIdleCallback and setTimeout
 */
export function setAutoSaveTimer(callback: () => void, delay: number = 500): void {
  clearAutoSaveTimer();

  // Always use setTimeout for the delay, then optionally use requestIdleCallback
  // for better performance when the timeout fires
  autoSaveTimer = setTimeout(() => {
    const scheduleCallback = () => {
      callback();
    };

    // Use requestIdleCallback for better performance if available
    if (window.requestIdleCallback) {
      window.requestIdleCallback(scheduleCallback);
    } else {
      // Execute immediately if requestIdleCallback is not available
      scheduleCallback();
    }
  }, delay);
}

/**
 * Cleanup on unmount
 */
export function cleanupAutoSave(): void {
  clearAutoSaveTimer();
}

// Legacy export for backward compatibility (will be removed in next iteration)
export const globalAutoSaveState = {
  acquireLock: acquireAutoSaveLock,
  releaseLock: releaseAutoSaveLock,
  pause: pauseAutoSave,
  resume: resumeAutoSave,
  get paused() {
    return autoSavePaused;
  },
  shouldSkipCycle: shouldSkipAutoSaveCycle,
  clearTimer: clearAutoSaveTimer,
  setTimer: setAutoSaveTimer,
  cleanup: cleanupAutoSave,
};
