/**
 * Masks an email address.
 * @param email The email address to mask.
 * @returns The masked email address.
 */
export function maskEmail(email: string): string {
  if (!email) return '';

  const [username, domain] = email.split('@');

  const maskedUsername = maskString(username);
  const maskedDomain = domain
    ? `@${maskString(domain.split('.')[0])}.${domain.split('.').slice(1).join('.')}`
    : '';

  return maskedUsername + maskedDomain;
}

function maskString(str: string): string {
  if (str.length <= 3) {
    return str.replace(/./g, '*');
  }

  const firstChar = str.charAt(0);
  const lastChar = str.charAt(str.length - 1);
  const middleChars = str.slice(1, -1).replace(/./g, '*');

  return `${firstChar}${middleChars}${lastChar}`;
}
