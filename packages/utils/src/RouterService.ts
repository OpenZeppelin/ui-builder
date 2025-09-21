/**
 * RouterService
 *
 * Minimal wrapper to abstract routing. This avoids coupling the app to a
 * specific router implementation and allows future swaps.
 */
export interface RouterService {
  /** Returns the current location href (string form). */
  currentLocation(): string;
  /** Returns the value of a query parameter or null if not present. */
  getParam(name: string): string | null;
  /** Navigates to a path (client-side when router is present; falls back to location). */
  navigate(path: string): void;
}

/**
 * Default implementation that relies on the browser Location API.
 * The builder app can replace this with a router-bound implementation if needed.
 */
class BrowserRouterService implements RouterService {
  public currentLocation(): string {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }

  public getParam(name: string): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  public navigate(path: string): void {
    if (typeof window === 'undefined') return;
    // Basic implementation: update location. A router-aware version can override this.
    if (path.startsWith('http://') || path.startsWith('https://')) {
      window.location.assign(path);
    } else {
      // Preserve origin and replace pathname/query as provided
      const url = new URL(path, window.location.origin);
      window.history.pushState({}, '', url.toString());
      // Fire a popstate event so listeners can react (if any)
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }
}

/**
 * Singleton instance for global consumption.
 */
export const routerService: RouterService = new BrowserRouterService();
