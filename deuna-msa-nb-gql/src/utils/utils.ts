import * as crypto from 'crypto';
import * as forge from 'node-forge';

/**
 * Capitalizes the first letter of a string and converts the rest of the letters to lowercase.
 *
 * @param text - The string to be capitalized.
 * @returns The capitalized string.
 */
export function capitalizer(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLocaleLowerCase();
}

/**
 * Converts a given text to PascalCase.
 *
 * @param text - The text to convert.
 * @returns The converted text in PascalCase.
 */
export function pascalCase(text: string) {
  const arr = text.split(' ');

  for (let i = 0; i < arr.length; i++) {
    arr[i] =
      arr[i].charAt(0).toUpperCase() + arr[i].slice(1).toLocaleLowerCase();
  }

  return arr.join(' ');
}

/**
 * Encrypts the given plain text using the provided key.
 *
 * @param plainText - The plain text to be encrypted.
 * @param key - The key used for encryption.
 * @returns The encrypted text.
 */
export function encrypt(plainText: string, key: string): string {
  const publicKey = forge.pki.publicKeyFromPem(key);
  return forge.util.encode64(
    publicKey.encrypt(plainText, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    }),
  );
}

/**
 * Encrypts a hash response using a public key.
 *
 * @param publicKey - The public key used for encryption.
 * @param hash - The hash to be encrypted.
 * @returns The encrypted hash.
 */
export function encryptHashResponse(publicKey: string, hash: string): string {
  const signaturePublicDecode = forge.util.decode64(publicKey);

  return encrypt(hash, signaturePublicDecode);
}

/**
 * Generates an encrypted hash response.
 *
 * @param data - The data to be hashed.
 * @param publicKey - The public key used for encryption.
 * @returns The encrypted hash response.
 */
export function generateEncryptHashResponse(
  data: any,
  publicKey: string,
): string {
  const bodyParsed = JSON.stringify(data);
  const hash = crypto.createHash('sha256').update(bodyParsed).digest('hex');
  const hashEncryptBody = encryptHashResponse(publicKey, hash);
  return hashEncryptBody;
}

/**
 * Masks sensitive data in the given object.
 * @param data - The object containing the data to be masked.
 * @returns The object with sensitive data masked.
 */
export function maskSensitiveData(data: any): any {
  if (data && typeof data === 'object') {
    const maskedData: { [key: string]: any } = {};

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (
          typeof data[key] === 'string' &&
          (isSensitiveData(key) || isLargeData(key))
        ) {
          maskedData[key] = '*****';
        } else {
          maskedData[key] = data[key];
        }
      }
    }

    return maskedData;
  }

  return data;
}

/**
 * Checks if a given key contains sensitive data.
 * @param key - The key to check.
 * @returns A boolean indicating whether the key contains sensitive data.
 */
export function isSensitiveData(key: string): boolean {
  const sensitiveKeywords = [
    'password',
    'aditionalContact',
    'principalContact',
    'otp',
    'identification',
    'documentNumber',
    'documentCode',
  ];

  return sensitiveKeywords.some((keyword) =>
    key.toLowerCase().includes(keyword.toLocaleLowerCase()),
  );
}

/**
 * Checks if the given key is associated with large data.
 * @param key - The key to check.
 * @returns A boolean indicating whether the key is associated with large data.
 */
export function isLargeData(key: string): boolean {
  const largeKeywords = ['imageBuffer', 'templateRaw', 'bestImage'];

  return largeKeywords.some((keyword) =>
    key.toLowerCase().includes(keyword.toLocaleLowerCase()),
  );
}
