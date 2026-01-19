// Written by ChatGPT

import {
	randomBytes,
	createCipheriv,
	createDecipheriv,
	createHash,
} from "crypto"

class Crypto {
	private static readonly CIPHER = "aes-256-cbc"
	private readonly SECRET_KEY: Buffer

	constructor(key: string) {
		if (key.length !== 128) {
			throw new Error("Key must be 128 characters long")
		}

		// Hash the key to derive a 32-byte key suitable for AES-256-CBC
		this.SECRET_KEY = createHash("sha256").update(key).digest()
	}

	/**
	 * Encrypts the given plaintext using AES-256-CBC cipher and returns the encrypted data in base64 format.
	 *
	 * @param plaintext The plaintext string to be encrypted.
	 * @returns The base64-encoded encrypted string which includes both the IV and ciphertext.
	 */
	encrypt(plaintext: string): string {
		const iv = randomBytes(16) // IV length for AES-256-CBC is 16 bytes
		const cipher = createCipheriv(Crypto.CIPHER, this.SECRET_KEY, iv)
		const encrypted = Buffer.concat([
			cipher.update(plaintext, "utf8"),
			cipher.final(),
		])

		// Combine IV and ciphertext, then encode in base64
		return Buffer.concat([iv, encrypted]).toString("base64")
	}

	/**
	 * Decrypts the given base64-encoded encrypted string and returns the original plaintext.
	 *
	 * @param encrypted The base64-encoded string to be decrypted.
	 * @returns The decrypted plaintext.
	 */
	decrypt(encrypted: string): string {
		const data = Buffer.from(encrypted, "base64")
		const iv = data.subarray(0, 16) // Extract the IV (first 16 bytes)
		const ciphertext = data.subarray(16) // Extract the ciphertext

		const decipher = createDecipheriv(Crypto.CIPHER, this.SECRET_KEY, iv)
		const decrypted = Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		])

		return decrypted.toString("utf8")
	}
}

export default Crypto
