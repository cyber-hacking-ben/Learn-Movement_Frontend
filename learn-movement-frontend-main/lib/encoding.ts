export function decodeBase64ToUint8Array(base64: string): Uint8Array {
  // browser-friendly base64 -> Uint8Array
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
