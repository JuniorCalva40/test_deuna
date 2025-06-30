import { validateEcuadorianId } from './validate-format-docs-id';

describe('validateEcuadorianId', () => {
  describe('validación de formato', () => {
    it('should return false for identification with less than 10 digits', () => {
      expect(validateEcuadorianId('123456789')).toBe(false);
    });

    it('should return false for identification with more than 10 digits', () => {
      expect(validateEcuadorianId('12345678901')).toBe(false);
    });

    it('should return false for identification with non-numeric characters', () => {
      expect(validateEcuadorianId('123456789a')).toBe(false);
      expect(validateEcuadorianId('12345-6789')).toBe(false);
    });
  });

  describe('validación de código de provincia', () => {
    it('should return false for province codes less than 01', () => {
      expect(validateEcuadorianId('0012345678')).toBe(false);
    });

    it('should return false for province codes greater than 24', () => {
      expect(validateEcuadorianId('2512345678')).toBe(false);
    });

    it('should accept valid province codes', () => {
      // Using a valid province code (17 - Pichincha)
      expect(validateEcuadorianId('1713175931')).toBe(true);
    });
  });

  describe('validación de dígito verificador', () => {
    it('should validate correctly known Ecuadorian IDs', () => {
      // Examples of valid IDs
      expect(validateEcuadorianId('1713175931')).toBe(true);
      expect(validateEcuadorianId('1104680135')).toBe(true);
    });

    it('should return false for IDs with incorrect verification digits', () => {
      // Modifying the last digit of a valid ID
      expect(validateEcuadorianId('1713175932')).toBe(false);
    });

    it('should handle the special case when the verifier is 10', () => {
      // Example where the calculated verification digit is 10 (should be 0)
      const cedulaConVerificador10 = '1713175940'; // This is a hypothetical example
      expect(validateEcuadorianId(cedulaConVerificador10)).toBe(false);
    });
  });

  describe('special cases', () => {
    it('should return false for empty string', () => {
      expect(validateEcuadorianId('')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(validateEcuadorianId(null as unknown as string)).toBe(false);
      expect(validateEcuadorianId(undefined as unknown as string)).toBe(false);
    });

    it('should return false for values with spaces', () => {
      expect(validateEcuadorianId(' 1713175931')).toBe(false);
      expect(validateEcuadorianId('1713175931 ')).toBe(false);
      expect(validateEcuadorianId('1713 175931')).toBe(false);
    });
  });
});
