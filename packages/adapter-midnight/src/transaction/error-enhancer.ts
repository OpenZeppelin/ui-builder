import { logger } from '@openzeppelin/ui-utils';

const SYSTEM_LOG_TAG = 'MidnightErrorEnhancer';

/**
 * Enhanced error information with user-friendly message and optional fix suggestions
 */
export interface EnhancedError {
  /** The original error message from the SDK */
  originalMessage: string;
  /** User-friendly error message */
  userMessage: string;
  /** Optional suggestions for how to fix the error */
  suggestions?: string[];
  /** The error category for better handling */
  category: 'type_mismatch' | 'validation' | 'network' | 'state' | 'proof' | 'unknown';
}

/**
 * Patterns for detecting specific Midnight SDK errors
 */
const ERROR_PATTERNS = {
  // Vector size mismatch: "expected value of type Vector<3, ...> but received [ ... ]"
  // Must handle nested generics like Vector<10, Maybe<Opaque<"string">>>
  vectorSizeMismatch:
    /expected value of type Vector<(\d+),\s*(.+?)>\s*but received\s*\[([^\]]*)\]/is,

  // Maybe type error (with or without "struct" prefix)
  // Must handle nested generics like Maybe<Opaque<"string">>
  maybeMismatch: /expected value of type\s+(?:struct\s+)?Maybe<(.+?)>\s*but received\s+(.+)/is,

  // General type error: "expected value of type X but received Y"
  // Must handle complex types like Map<string, Array<number>>
  typeMismatch: /expected value of type\s+(.+?)\s+but received\s+(.+)/is,

  // Private state errors
  privateStateError:
    /No private state found|private state|organizer secret key|identity secret key/i,

  // Proof generation errors
  proofError: /proof|prover|zkSnark/i,

  // Network errors
  networkError: /network|timeout|connection/i,
} as const;

/**
 * Enhances Midnight SDK error messages to be more user-friendly
 *
 * @param error The error thrown by the Midnight SDK
 * @param functionName The name of the function/circuit being called
 * @returns Enhanced error information with user-friendly messages
 */
export function enhanceMidnightError(error: unknown, functionName?: string): EnhancedError {
  const originalMessage = error instanceof Error ? error.message : String(error);
  const fnContext = functionName ? ` in function "${functionName}"` : '';

  // Vector size mismatch
  const vectorMatch = originalMessage.match(ERROR_PATTERNS.vectorSizeMismatch);
  if (vectorMatch) {
    const [, expectedSize, elementType, receivedArray] = vectorMatch;

    // Count items in the received array by counting commas at the top level
    // We need to be careful with nested structures
    let receivedCount = 0;
    if (receivedArray.trim().length > 0) {
      // Simple heuristic: count top-level commas + 1
      // This works for most cases but might be inaccurate for deeply nested structures
      let depth = 0;
      let inString = false;
      let items = 0;
      for (let i = 0; i < receivedArray.length; i++) {
        const char = receivedArray[i];
        if (char === '"' || char === "'") {
          inString = !inString;
        } else if (!inString) {
          if (char === '{' || char === '[') {
            depth++;
          } else if (char === '}' || char === ']') {
            depth--;
          } else if (char === ',' && depth === 0) {
            items++;
          }
        }
      }
      // Add 1 for the last item (after the last comma)
      receivedCount = receivedArray.trim().length > 0 ? items + 1 : 0;
    }

    logger.debug(SYSTEM_LOG_TAG, 'Detected Vector size mismatch error', {
      expectedSize,
      elementType,
      receivedCount,
      functionName,
    });

    return {
      originalMessage,
      userMessage: `Invalid array size${fnContext}. Expected exactly ${expectedSize} items, but received ${receivedCount}.`,
      suggestions: [
        `Ensure your array has exactly ${expectedSize} elements of type ${elementType.trim()}.`,
        receivedCount < Number(expectedSize)
          ? `Add ${Number(expectedSize) - receivedCount} more item(s) to the array.`
          : `Remove ${receivedCount - Number(expectedSize)} item(s) from the array.`,
        'This is a fixed-size array (Vector) type that requires an exact number of elements.',
      ],
      category: 'type_mismatch',
    };
  }

  // Maybe type mismatch (not using the correct struct format)
  const maybeMatch = originalMessage.match(ERROR_PATTERNS.maybeMismatch);
  if (maybeMatch) {
    const [, innerType, received] = maybeMatch;

    logger.debug(SYSTEM_LOG_TAG, 'Detected Maybe type mismatch error', {
      innerType,
      received,
      functionName,
    });

    return {
      originalMessage,
      userMessage: `Invalid optional value format${fnContext}. The value should be empty or a valid ${innerType.trim()}.`,
      suggestions: [
        'If the field is optional and you want to skip it, leave it empty.',
        'If providing a value, ensure it matches the expected type.',
        'The UI Builder should handle this automatically - this may be an adapter bug.',
      ],
      category: 'type_mismatch',
    };
  }

  // General type mismatch
  const typeMatch = originalMessage.match(ERROR_PATTERNS.typeMismatch);
  if (typeMatch) {
    const [, expectedType, received] = typeMatch;

    logger.debug(SYSTEM_LOG_TAG, 'Detected general type mismatch error', {
      expectedType,
      received,
      functionName,
    });

    return {
      originalMessage,
      userMessage: `Type mismatch${fnContext}. Expected ${expectedType.trim()}, but received ${received.trim()}.`,
      suggestions: [
        `Ensure all input values match their expected types.`,
        `Check that enum values, arrays, and complex types are formatted correctly.`,
      ],
      category: 'type_mismatch',
    };
  }

  // Private state errors
  if (ERROR_PATTERNS.privateStateError.test(originalMessage)) {
    logger.debug(SYSTEM_LOG_TAG, 'Detected private state error', { functionName });

    return {
      originalMessage,
      userMessage: `Private state not initialized${fnContext}.`,
      suggestions: [
        'If this function requires an identity secret, ensure the secret is configured in the form.',
        'For participant functions, try calling a public function first to initialize state.',
        'Check that the contract has been properly deployed and the private state ID is correct.',
      ],
      category: 'state',
    };
  }

  // Proof generation errors
  if (ERROR_PATTERNS.proofError.test(originalMessage)) {
    logger.debug(SYSTEM_LOG_TAG, 'Detected proof generation error', { functionName });

    return {
      originalMessage,
      userMessage: `Proof generation failed${fnContext}.`,
      suggestions: [
        'Verify that all ZK artifacts are correctly loaded.',
        'Check that input values satisfy all circuit constraints.',
        'Ensure the proof server is accessible and responsive.',
      ],
      category: 'proof',
    };
  }

  // Network errors
  if (ERROR_PATTERNS.networkError.test(originalMessage)) {
    logger.debug(SYSTEM_LOG_TAG, 'Detected network error', { functionName });

    return {
      originalMessage,
      userMessage: `Network error${fnContext}.`,
      suggestions: [
        'Check your internet connection.',
        'Verify that the Midnight network nodes are accessible.',
        'Try again in a few moments.',
      ],
      category: 'network',
    };
  }

  // Unknown error - return as-is with minimal enhancement
  logger.debug(SYSTEM_LOG_TAG, 'Unknown error type', { originalMessage, functionName });

  return {
    originalMessage,
    userMessage: `Transaction failed${fnContext}: ${originalMessage}`,
    suggestions: ['Check the developer console for more details.'],
    category: 'unknown',
  };
}

/**
 * Formats an enhanced error into a complete error message with suggestions
 *
 * @param enhanced The enhanced error information
 * @returns Formatted error message
 */
export function formatEnhancedError(enhanced: EnhancedError): string {
  let message = enhanced.userMessage;

  if (enhanced.suggestions && enhanced.suggestions.length > 0) {
    message += '\n\nSuggestions:';
    enhanced.suggestions.forEach((suggestion, idx) => {
      message += `\n  ${idx + 1}. ${suggestion}`;
    });
  }

  return message;
}
