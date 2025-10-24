/**
 * Browser initialization for Midnight adapter
 *
 * This module provides polyfills and environment setup required for the Midnight SDK
 * to run in a browser environment. These are loaded lazily when the Midnight adapter
 * is first imported, rather than being bundled into the main application.
 *
 * This ensures other ecosystems (EVM, Solana, Stellar) don't pay the cost of
 * Midnight-specific browser compatibility shims.
 */

let isInitialized = false;

/**
 * Minimal CommonJS module interface for browser contract evaluation
 * This is intentionally minimal - we only need exports, not the full Node.js Module interface
 */
interface MinimalCommonJSModule {
  exports: Record<string, unknown>;
}

/**
 * Installs browser polyfills required for Midnight SDK and contract evaluation
 *
 * Includes:
 * 1. Buffer polyfill - Required for @dao-xyz/borsh (Midnight SDK serialization)
 * 2. CommonJS polyfills - Required for dynamic contract evaluation
 *
 * Called automatically when the adapter is first loaded.
 */
export function initializeMidnightBrowserEnvironment(): void {
  if (isInitialized) {
    return; // Already initialized
  }

  // Install Buffer polyfill for @dao-xyz/borsh compatibility
  // This MUST be installed before any Midnight SDK modules load
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).Buffer === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Buffer = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: function (data: any, encoding?: string) {
        let uint8Array;
        if (typeof data === 'string') {
          if (encoding === 'hex') {
            const bytes = [];
            for (let i = 0; i < data.length; i += 2) {
              bytes.push(parseInt(data.substr(i, 2), 16));
            }
            uint8Array = new Uint8Array(bytes);
          } else if (encoding === 'base64') {
            const binary = atob(data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            uint8Array = bytes;
          } else {
            const encoder = new TextEncoder();
            uint8Array = encoder.encode(data);
          }
        } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
          uint8Array = new Uint8Array(data);
        } else {
          uint8Array = new Uint8Array(data);
        }
        // Add toString method for hex/base64 encoding
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (uint8Array as any).toString = function (enc?: string) {
          if (enc === 'hex') {
            return Array.from(this as Uint8Array)
              .map((b: number) => b.toString(16).padStart(2, '0'))
              .join('');
          }
          if (enc === 'base64') {
            let binary = '';
            for (let i = 0; i < this.length; i++) {
              binary += String.fromCharCode(this[i]);
            }
            return btoa(binary);
          }
          return new TextDecoder().decode(this);
        };
        return uint8Array;
      },
      alloc: function (size: number) {
        return new Uint8Array(size);
      },
      allocUnsafe: function (size: number) {
        return new Uint8Array(size);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isBuffer: function (obj: any) {
        return obj instanceof Uint8Array;
      },
      byteLength: function (str: string, encoding?: string) {
        if (encoding === 'utf8' || !encoding) return new TextEncoder().encode(str).length;
        if (encoding === 'hex') return str.length / 2;
        if (encoding === 'base64') return Math.floor((str.length * 3) / 4);
        return new TextEncoder().encode(str).length;
      },
      concat: function (buffers: Uint8Array[]) {
        const totalLength = buffers.reduce(function (acc, buf) {
          return acc + buf.length;
        }, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of buffers) {
          result.set(buf, offset);
          offset += buf.length;
        }
        return result;
      },
    };
  }

  // Install CommonJS globals for contract evaluation
  // TypeScript has strict types for these from @types/node, but we need minimal browser polyfills
  // Use type assertions to bypass Node.js type checking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).exports === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).exports = {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).module === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).module = { exports: (globalThis as any).exports } as MinimalCommonJSModule;
  }

  isInitialized = true;
}

// Auto-initialize when this module is imported
initializeMidnightBrowserEnvironment();
