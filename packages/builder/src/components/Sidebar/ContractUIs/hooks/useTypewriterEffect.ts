import { useEffect, useRef, useState } from 'react';

interface UseTypewriterEffectOptions {
  /** Speed of typing in milliseconds per character */
  typingSpeed?: number;
  /** Speed of erasing in milliseconds per character */
  erasingSpeed?: number;
  /** Delay before starting to erase old text */
  eraseDelay?: number;
  /** Delay before starting to type new text */
  typeDelay?: number;
  /** Minimum character difference to trigger animation */
  minDifferenceThreshold?: number;
}

/**
 * Custom hook that provides typewriter animation effect when text changes
 * @param text The text to display with typewriter effect
 * @param options Animation timing options
 * @returns Object with displayText and isAnimating state
 */
export function useTypewriterEffect(text: string, options: UseTypewriterEffectOptions = {}) {
  const {
    typingSpeed = 50,
    erasingSpeed = 30,
    eraseDelay = 100,
    typeDelay = 200,
    minDifferenceThreshold = 2,
  } = options;

  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousTextRef = useRef(text);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If text hasn't changed, don't animate
    if (text === previousTextRef.current) {
      return;
    }

    const oldText = previousTextRef.current;
    const newText = text;

    // Skip animation for very small changes (like single character edits)
    const difference = Math.abs(newText.length - oldText.length);
    if (
      difference < minDifferenceThreshold &&
      newText.includes(oldText.substring(0, oldText.length - difference))
    ) {
      setDisplayText(newText);
      previousTextRef.current = text;
      return;
    }

    // Update the ref to the new text
    previousTextRef.current = text;

    // Start animation
    setIsAnimating(true);

    let currentStep = 0;

    const animate = () => {
      if (currentStep < oldText.length) {
        // Erasing phase - remove characters from the end
        const charsToShow = oldText.length - currentStep - 1;
        setDisplayText(oldText.substring(0, charsToShow));
        currentStep++;
        timeoutRef.current = setTimeout(animate, erasingSpeed);
      } else if (currentStep === oldText.length) {
        // Pause between erasing and typing
        currentStep++;
        timeoutRef.current = setTimeout(animate, typeDelay);
      } else {
        // Typing phase - add characters
        const charsToShow = currentStep - oldText.length - 1;
        setDisplayText(newText.substring(0, charsToShow + 1));
        currentStep++;

        if (charsToShow + 1 >= newText.length) {
          // Animation complete
          setIsAnimating(false);
        } else {
          timeoutRef.current = setTimeout(animate, typingSpeed);
        }
      }
    };

    // Start with a small delay
    timeoutRef.current = setTimeout(animate, eraseDelay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, typingSpeed, erasingSpeed, eraseDelay, typeDelay, minDifferenceThreshold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    displayText,
    isAnimating,
  };
}
