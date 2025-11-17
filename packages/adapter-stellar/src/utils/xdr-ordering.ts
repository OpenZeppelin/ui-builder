import { xdr } from '@stellar/stellar-sdk';

/**
 * Compare two ScVals based on their XDR encoding without relying on Node's Buffer.
 */
export function compareScValsByXdr(a: xdr.ScVal, b: xdr.ScVal): number {
  const aBytes = getBytes(a);
  const bBytes = getBytes(b);

  const minLength = Math.min(aBytes.length, bBytes.length);
  for (let index = 0; index < minLength; index += 1) {
    const diff = aBytes[index] - bBytes[index];
    if (diff !== 0) {
      return diff;
    }
  }

  return aBytes.length - bBytes.length;
}

function getBytes(scVal: xdr.ScVal): Uint8Array {
  const xdrValue = scVal.toXDR();

  // In browsers, toXDR may already return a Uint8Array (Buffer is a Uint8Array subclass in Node).
  if (xdrValue instanceof Uint8Array) {
    return xdrValue;
  }

  // Handle array-like objects (e.g., Buffer in Node.js)
  const arrayLike = xdrValue as ArrayLike<number>;
  const result = new Uint8Array(arrayLike.length);
  for (let index = 0; index < arrayLike.length; index += 1) {
    result[index] = arrayLike[index];
  }
  return result;
}
