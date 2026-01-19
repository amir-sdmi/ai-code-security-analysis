/**
 * Build with Claude.ai, JSDoc with CODEIUM
 * Typescript's Format Preserving Encryption
 */
const urlSafeChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * Encrypts a given plaintext string using the FPE algorithm.
 * @param plaintext The string to encrypt.
 * @param key The key used for encryption.
 * @param tweak The tweak used for encryption.
 * @returns The encrypted string.
 */
export function encrypt(plaintext: string, key: string, tweak: string): string {
  const keyBytes = new TextEncoder().encode(key);
  const tweakBytes = new TextEncoder().encode(tweak);

  const encrypt = (char: string, index: number): string => {
    const shift =
      (keyBytes[index % keyBytes.length] ^
        tweakBytes[index % tweakBytes.length]) %
      urlSafeChars.length;
    const urlSafeIndex = urlSafeChars.indexOf(char);

    if (urlSafeIndex !== -1) {
      return urlSafeChars[(urlSafeIndex + shift) % urlSafeChars.length];
    }
    return char;
  };

  return plaintext.split("").map(encrypt).join("");
}

/**
 * Decrypts a given ciphertext string using the FPE algorithm.
 * @param ciphertext The string to decrypt.
 * @param key The key used for decryption.
 * @param tweak The tweak used for decryption.
 * @returns The decrypted string.
 */
export function decrypt(
  ciphertext: string,
  key: string,
  tweak: string
): string {
  const keyBytes = new TextEncoder().encode(key);
  const tweakBytes = new TextEncoder().encode(tweak);

  const decrypt = (char: string, index: number): string => {
    const shift =
      (keyBytes[index % keyBytes.length] ^
        tweakBytes[index % tweakBytes.length]) %
      urlSafeChars.length;
    const urlSafeIndex = urlSafeChars.indexOf(char);

    if (urlSafeIndex !== -1) {
      return urlSafeChars[
        (urlSafeIndex - shift + urlSafeChars.length) % urlSafeChars.length
      ];
    }
    return char;
  };

  return ciphertext.split("").map(decrypt).join("");
}

const DEFAULT_LENGTH = 21;
interface EncryptIdProps {
  length: number;
}
/**
 * Encrypts a given id number using the FPE algorithm.
 * @param id The number to encrypt.
 * @param key The key used for encryption.
 * @param tweak The tweak used for encryption.
 * @param {EncryptIdProps} [props] The options for encryption.
 * @returns The encrypted string.
 */
export function encryptId(
  id: number,
  key: string,
  tweak: string,
  { length }: EncryptIdProps = {
    length: DEFAULT_LENGTH,
  }
) {
  const idString = String(id).padStart(length, "0");
  return encrypt(idString, key, tweak);
}

/**
 * Decrypts a given ciphertext string using the FPE algorithm.
 * @param encryptedId The string to decrypt.
 * @param key The key used for decryption.
 * @param tweak The tweak used for decryption.
 * @returns The decrypted number.
 */
export function decryptId(encryptedId: string, key: string, tweak: string) {
  const idString = decrypt(String(encryptedId), key, tweak);
  return Number(idString);
}
