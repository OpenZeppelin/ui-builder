/**
 * Common Midnight type helper utilities shared across mapping, parsing, and formatting.
 */

export function isArrayType(type: string): { isArray: boolean; elementType?: string } {
  // Generic form: Array<T>
  const generic = type.match(/^Array<\s*(.+)\s*>$/);
  if (generic) return { isArray: true, elementType: generic[1].trim() };
  // Brackets form: T[] or T[5]
  const brackets = type.match(/^(.+?)\s*\[\d*\]$/);
  if (brackets) return { isArray: true, elementType: brackets[1].trim() };
  return { isArray: false };
}

export function isMaybeType(type: string): { isMaybe: boolean; innerType?: string } {
  const match = type.match(/^Maybe<\s*(.+)\s*>$/i);
  if (match) return { isMaybe: true, innerType: match[1] };
  return { isMaybe: false };
}

export function isMapType(type: string): { isMap: boolean; keyType?: string; valueType?: string } {
  const outer = type.match(/^Map<\s*(.+)\s*>$/);
  if (!outer) return { isMap: false };
  const inner = outer[1];
  const parts = splitTopLevelParams(inner);
  if (parts.length !== 2) return { isMap: false };
  const [key, value] = parts;
  return { isMap: true, keyType: key.trim(), valueType: value.trim() };
}

export function isBytesType(type: string): boolean {
  return (
    type === 'Uint8Array' ||
    type.toLowerCase() === 'bytes' ||
    type.toLowerCase() === 'byteslike' ||
    /^Bytes<\d+>$/i.test(type) // Matches Bytes<32>, Bytes<64>, etc.
  );
}

/**
 * Detects Midnight fixed-size vectors: Vector<N, T>
 */
export function isVectorType(type: string): {
  isVector: boolean;
  size?: number;
  elementType?: string;
} {
  const match = type.match(/^Vector<\s*(\d+)\s*,\s*(.+)\s*>$/i);
  if (!match) return { isVector: false };
  const size = Number.parseInt(match[1], 10);
  const elementType = match[2].trim();
  return { isVector: true, size, elementType };
}

/**
 * Detects unsigned integer types: Uint<0..MAX>
 */
export function isUintType(type: string): boolean {
  return /^Uint<\s*0\s*\.\.\s*\d+\s*>$/i.test(type);
}

// --- Internal helpers ------------------------------------------------------ //
function splitTopLevelParams(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '<') {
      depth++;
      current += ch;
      continue;
    }
    if (ch === '>') {
      depth--;
      current += ch;
      continue;
    }
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
