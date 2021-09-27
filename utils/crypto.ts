import { 
  BinaryToTextEncoding, 
  createHash,
  HashOptions
} from 'crypto';
import { 
  box, 
  BoxKeyPair, 
  randomBytes 
} from 'tweetnacl';
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64
} from 'tweetnacl-util';
import { customAlphabet } from 'nanoid/async';

const CUSTOM_ALPHABET = '123456789abcdefghijklmnopqrstuvwxyz';

// Initializes a new keypair
export function generateKeypair (): BoxKeyPair {
  return box.keyPair();
}
// Computes a shared secret from a public key
export function computeSecret (publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return box.before(publicKey, secretKey);
}
// Encrypts message based on a shared secret
export function encryptMessage (secret: Uint8Array, message: any): string {
  const nonce: Uint8Array = randomBytes(box.nonceLength);
  const messageAsUint8: Uint8Array = decodeUTF8(JSON.stringify(message));
  const encrypted: Uint8Array = box.after(messageAsUint8, nonce, secret);
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);
  return encodeBase64(fullMessage);
}
// Decrypts messages based on a shared secret
export function decryptMessage (secret: Uint8Array, encryptedMessage: string): any {
  const messageAsUint8WithNonce: Uint8Array = decodeBase64(encryptedMessage);
  const nonce: Uint8Array = messageAsUint8WithNonce.slice(0, box.nonceLength);
  const message: Uint8Array = messageAsUint8WithNonce.slice(box.nonceLength, encryptedMessage.length);
  const decrypted: Uint8Array | null = box.open.after(message, nonce, secret);
  if (!decrypted) {
    throw new Error('Unable to decrypt message');
  }
  return JSON.parse(encodeUTF8(decrypted));
}
// Creates a new random identifer
export async function createSafeIdentifier (length: number = 12): Promise<string> {
  return await customAlphabet(CUSTOM_ALPHABET, length)();
}
// Computes shasum of a value
export function computeShasum (data: string, salt: string, algo: string = 'sha256', encoding: BinaryToTextEncoding = 'base64'): string {
  return createHash(algo, {
    salt
  } as HashOptions).update(data).digest(encoding);
}
