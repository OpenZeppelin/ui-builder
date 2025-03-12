/**
 * Core utility functions for chain-agnostic operations
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind's merge strategy
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique ID for form fields, etc.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
