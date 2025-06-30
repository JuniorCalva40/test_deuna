export const validateEcuadorianId = (identificationNumber: string): boolean => {
  // Check if the input is exactly 10 digits
  if (!/^\d{10}$/.test(identificationNumber)) {
    return false;
  }

  // Get province code (first 2 digits)
  const provinceCode = parseInt(identificationNumber.substring(0, 2), 10);
  if (provinceCode < 1 || provinceCode > 24) {
    return false;
  }

  // Get last digit (verification digit)
  const lastDigit = parseInt(identificationNumber.charAt(9), 10);

  // Calculate verification digit
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  // Process each digit except the last one
  for (let i = 0; i < coefficients.length; i++) {
    let value = parseInt(identificationNumber.charAt(i), 10) * coefficients[i];
    if (value > 9) {
      value -= 9;
    }
    sum += value;
  }

  // Calculate verification digit
  const decena = Math.ceil(sum / 10) * 10;
  const calculatedVerifier = decena - sum;

  // Compare calculated verifier with the last digit
  return (
    calculatedVerifier === lastDigit ||
    (calculatedVerifier === 10 && lastDigit === 0)
  );
};

// Usage examples:
// console.log(validateEcuadorianId('1234567890')); // false
// console.log(validateEcuadorianId('1713175931')); // true
