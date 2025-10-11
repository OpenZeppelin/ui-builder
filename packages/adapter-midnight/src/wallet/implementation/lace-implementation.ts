import type { DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

import type { MidnightWalletConnectionStatus } from '../types';

/**
 * LaceWalletImplementation
 *
 * Core wallet adapter for the Lace Midnight wallet extension.
 *
 * DESIGN DECISIONS & LIMITATIONS:
 *
 * 1. **Event Emulation via Polling**
 *    - The Lace Midnight DAppConnectorWalletAPI does not expose native `onAccountChange` events.
 *    - We emulate an event-driven API by polling `api.state()` to detect account changes.
 *    - Polling starts only when listeners subscribe, and stops when all listeners unsubscribe.
 *
 * 2. **Exponential Backoff & Visibility-Aware Polling**
 *    - Initial poll: 2s after enabling.
 *    - When disconnected or erroring: backoff doubles up to 15s to reduce aggressive prompts.
 *    - When connected: poll every 5s to detect account switches.
 *    - When document is hidden (tab inactive): pause polling to avoid intrusive popups.
 *
 * 3. **Guard Against Multiple `enable()` Calls**
 *    - `connect()` uses `connectInFlight` flag to prevent re-triggering the wallet popup if called rapidly
 *      (e.g., by React Strict Mode double-effects or user double-clicks).
 *    - Once `enabledApi` is held, we reuse it until explicit disconnect.
 *
 * 4. **No Immediate State Read After `enable()`**
 *    - Calling `api.state()` immediately after `enable()` can re-prompt the user if the wallet is locked.
 *    - We rely on the polling loop to emit the initial address once the wallet is ready.
 *
 * 5. **Zero Listeners → Stop Polling**
 *    - If all listeners are removed (e.g., user dismisses popup and UI unsubscribes), polling stops immediately
 *      to avoid re-opening prompts indefinitely.
 *
 * FUTURE IMPROVEMENTS:
 * - If Lace Midnight adds native event handlers, replace polling with direct event subscriptions.
 * - Consider WebSocket or provider-side events if available in future versions.
 */
export class LaceWalletImplementation {
  private enabledApi: DAppConnectorWalletAPI | null = null;
  private connectInFlight = false;
  private accountChangeListeners = new Set<
    (status: MidnightWalletConnectionStatus, prevStatus: MidnightWalletConnectionStatus) => void
  >();
  private accountPollTimeout: NodeJS.Timeout | null = null;
  private nextPollDelayMs = 2000;
  private lastKnownAddress: string | null = null;

  public async isEnabled(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.midnight?.mnLace) return false;
    return window.midnight.mnLace.isEnabled();
  }

  public async connect(): Promise<{ connected: boolean; address?: string; error?: string }> {
    if (typeof window === 'undefined' || !window.midnight?.mnLace) {
      return { connected: false, error: 'Lace wallet not found.' };
    }
    try {
      // DESIGN DECISION: Guard against multiple enable() calls
      // - React Strict Mode can trigger effects twice in development
      // - User might click "Connect" button rapidly
      // - We prevent re-prompting by checking both enabledApi and connectInFlight
      if (!this.enabledApi && !this.connectInFlight) {
        this.connectInFlight = true;
        const api = await window.midnight.mnLace.enable();
        this.enabledApi = api;
        this.connectInFlight = false;
      }
      // DESIGN DECISION: Do not start polling here; wait until a listener subscribes
      // This prevents premature state() calls that could re-trigger popups during wallet unlock
      return { connected: true, address: this.lastKnownAddress ?? undefined };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      this.connectInFlight = false;
      return { connected: false, error: message };
    }
  }

  public disconnect(): void {
    this.enabledApi = null;
    this.stopAccountPolling();
    this.lastKnownAddress = null;
  }

  public getApi(): DAppConnectorWalletAPI | null {
    return this.enabledApi;
  }

  public getWalletConnectionStatus(): MidnightWalletConnectionStatus {
    return {
      isConnected: this.lastKnownAddress !== null,
      address: this.lastKnownAddress ?? undefined,
      status: this.lastKnownAddress ? 'connected' : 'disconnected',
    } as MidnightWalletConnectionStatus;
  }

  public onWalletConnectionChange(
    listener: (
      status: MidnightWalletConnectionStatus,
      prevStatus: MidnightWalletConnectionStatus
    ) => void
  ): () => void {
    this.accountChangeListeners.add(listener);
    if (this.lastKnownAddress !== null) {
      const curr = this.getWalletConnectionStatus();
      listener(curr, curr);
    }
    this.startAccountPolling();
    return () => {
      this.accountChangeListeners.delete(listener);
      if (this.accountChangeListeners.size === 0) this.stopAccountPolling();
    };
  }

  public updateConnectionStatus(address: string | null): void {
    const prev = this.getWalletConnectionStatus();
    this.lastKnownAddress = address;
    const curr = this.getWalletConnectionStatus();
    if (prev.address !== curr.address) this.emit(curr, prev);
  }

  private startAccountPolling(): void {
    if (this.accountPollTimeout || !this.enabledApi) return;
    if (this.accountChangeListeners.size === 0) return;
    this.nextPollDelayMs = 2000;
    this.schedulePollOnce();
  }

  private schedulePollOnce(): void {
    if (this.accountPollTimeout) return;
    this.accountPollTimeout = setTimeout(async () => {
      this.accountPollTimeout = null;
      try {
        if (!this.enabledApi) return;

        // DESIGN DECISION: Pause polling when document is hidden
        // - Reduces intrusive popups when user is on a different tab
        // - Exponential backoff ensures we don't hammer the wallet while tab is inactive
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          this.nextPollDelayMs = Math.min(this.nextPollDelayMs * 2, 15000);
          this.schedulePollOnce();
          return;
        }

        // DESIGN DECISION: Stop polling if all listeners unsubscribe
        // - This happens when user dismisses the unlock popup and UI cancels its subscription
        // - Prevents indefinite polling that would keep re-prompting the user
        if (this.accountChangeListeners.size === 0) {
          this.stopAccountPolling();
          return;
        }

        // LIMITATION: Must call api.state() to detect changes
        // - No native onAccountChange event available in DAppConnectorWalletAPI
        // - We avoid calling isEnabled() here as it can trigger prompts in some wallet builds
        const state = await this.enabledApi.state();
        const nextAddress = state?.address ?? null;
        if (nextAddress !== this.lastKnownAddress) {
          const prev = this.getWalletConnectionStatus();
          this.lastKnownAddress = nextAddress;
          const curr = this.getWalletConnectionStatus();
          this.emit(curr, prev);
        }

        // DESIGN DECISION: Adaptive polling intervals
        // - Connected: 5s (to detect account switches promptly)
        // - Disconnected/error: exponential backoff up to 15s (to avoid aggressive prompting)
        const connected = this.lastKnownAddress !== null;
        this.nextPollDelayMs = connected ? 5000 : Math.min(this.nextPollDelayMs * 2, 15000);
      } catch {
        // DESIGN DECISION: Back off on error
        // - Errors typically occur before user approves or if wallet is locked
        // - Exponential backoff reduces prompt frequency during these states
        this.nextPollDelayMs = Math.min(this.nextPollDelayMs * 2, 15000);
      } finally {
        this.schedulePollOnce();
      }
    }, this.nextPollDelayMs);
  }

  private stopAccountPolling(): void {
    if (this.accountPollTimeout) {
      clearTimeout(this.accountPollTimeout);
      this.accountPollTimeout = null;
    }
    this.nextPollDelayMs = 2000;
  }

  private emit(
    current: MidnightWalletConnectionStatus,
    prev: MidnightWalletConnectionStatus
  ): void {
    this.accountChangeListeners.forEach((cb) => {
      try {
        cb(current, prev);
      } catch {}
    });
  }
}
