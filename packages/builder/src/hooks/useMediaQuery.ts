import { useEffect, useState } from 'react';

/**
 * A React hook that tracks whether a CSS media query matches
 * @param query - The media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query currently matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid hydration mismatch in SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener for media query changes
    media.addEventListener('change', listener);

    // Cleanup
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}
