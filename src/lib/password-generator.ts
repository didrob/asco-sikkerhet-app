// Characters that are easy to distinguish visually
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';  // Without 'l'
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // Without 'I', 'O'
const NUMBERS = '23456789';                      // Without '0', '1'
const SPECIAL = '!@#$%&*';

/**
 * Generates a cryptographically random secure password
 * @param length - Password length (default 12)
 * @returns A secure random password
 */
export function generateSecurePassword(length = 12): string {
  const allChars = LOWERCASE + UPPERCASE + NUMBERS + SPECIAL;
  const charArray: string[] = [];

  // Use crypto for better randomness
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  // Ensure at least one of each type
  const getRandomChar = (chars: string, randomValue: number) => {
    return chars[randomValue % chars.length];
  };

  charArray.push(getRandomChar(LOWERCASE, randomValues[0]));
  charArray.push(getRandomChar(UPPERCASE, randomValues[1]));
  charArray.push(getRandomChar(NUMBERS, randomValues[2]));
  charArray.push(getRandomChar(SPECIAL, randomValues[3]));

  // Fill the rest with random characters from all types
  for (let i = charArray.length; i < length; i++) {
    charArray.push(getRandomChar(allChars, randomValues[i]));
  }

  // Shuffle the array using Fisher-Yates algorithm
  for (let i = charArray.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [charArray[i], charArray[j]] = [charArray[j], charArray[i]];
  }

  return charArray.join('');
}

/**
 * Calculates password expiry date
 * @param days - Number of days until expiry (default 7)
 * @returns Date object for expiry
 */
export function calculateExpiryDate(days = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
