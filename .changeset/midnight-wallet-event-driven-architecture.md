---
'@openzeppelin/ui-builder-adapter-midnight': minor
---

# Refactor Midnight wallet management to event-driven architecture with polling-based event emulation

**Architecture Changes:**

- Refactored wallet implementation to mirror Stellar adapter structure
- Introduced `LaceWalletImplementation` class for core wallet logic
- Added `midnightWalletImplementationManager` singleton pattern
- Created `MidnightWalletUiRoot` as the primary provider component
- Removed unnecessary `MidnightWalletProvider` wrapper for consistency
- Implemented facade functions in `connection.ts` for high-level wallet operations

**Event Emulation:**

- Lace Midnight DAppConnectorWalletAPI lacks native `onAccountChange` events
- Implemented polling-based event emulation via `api.state()` with exponential backoff
- Adaptive polling intervals: 2s initial, 5s when connected, up to 15s on errors
- Polling pauses when document is hidden (tab inactive) to reduce intrusive popups
- Polling starts only when listeners subscribe, stops when all unsubscribe

**UX Improvements:**

- Fixed repeated wallet popup issue by preventing multiple `enable()` calls
- Added `connectInFlight` guard against React Strict Mode double-effects and rapid clicks
- Implemented focus/blur heuristics to detect user dismissal of unlock popup
- 60s fallback timeout prevents infinite loading state in edge cases
- Auto-reconnect on page load for seamless UX with already-enabled wallets

**Documentation:**

- Added comprehensive inline comments explaining design decisions and limitations
- Created wallet module README documenting architecture and implementation details
- Documented all workarounds needed due to Lace API limitations
