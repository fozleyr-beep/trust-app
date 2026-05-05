import naclUtil from "tweetnacl-util";

export function bytesToBase64(bytes: Uint8Array): string {
  return naclUtil.encodeBase64(bytes);
}

export function base64ToBytes(value: string): Uint8Array {
  return naclUtil.decodeBase64(value);
}

export function utf8ToBytes(value: string): Uint8Array {
  return naclUtil.decodeUTF8(value);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return naclUtil.encodeUTF8(bytes);
}
