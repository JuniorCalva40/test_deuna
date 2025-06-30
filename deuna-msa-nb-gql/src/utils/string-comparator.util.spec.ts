import { findMissingStrings } from './string-comparator.util';

describe('String Comparator Utils', () => {
  describe('findMissingStrings', () => {
    const allSteps = [
      'start-onb-cnb',
      'confirm-data',
      'accept-billing',
      'accept-contract',
      'sign-contract',
    ];

    it('should be defined', () => {
      expect(findMissingStrings).toBeDefined();
    });

    it('should return empty array when all strings are present', () => {
      // Arrange
      const input = [...allSteps];

      // Act
      const result = findMissingStrings(input);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return all reference strings when input array is empty', () => {
      // Arrange
      const input: string[] = [];

      // Act
      const result = findMissingStrings(input);

      // Assert
      expect(result).toEqual(allSteps);
    });

    it('should return missing strings when some strings are missing', () => {
      // Arrange
      const input = ['start-onb-cnb', 'confirm-data'];
      const expected = ['accept-billing', 'accept-contract', 'sign-contract'];

      // Act
      const result = findMissingStrings(input);

      // Assert
      expect(result).toEqual(expected);
    });

    it('should handle single missing string', () => {
      // Arrange
      const input = allSteps.filter((step) => step !== 'sign-contract');
      const expected = ['sign-contract'];

      // Act
      const result = findMissingStrings(input);

      // Assert
      expect(result).toEqual(expected);
    });

    it('should ignore additional strings not in reference data', () => {
      // Arrange
      const input = [...allSteps, 'extra-step', 'another-step'];

      // Act
      const result = findMissingStrings(input);

      // Assert
      expect(result).toEqual([]);
    });

    it('should maintain order of missing strings according to reference data', () => {
      // Arrange
      const input = ['accept-contract', 'start-onb-cnb'];
      const expected = ['confirm-data', 'accept-billing', 'sign-contract'];

      // Act
      const result = findMissingStrings(input);

      // Assert
      expect(result).toEqual(expected);
    });

    it('should handle case-sensitive comparisons correctly', () => {
      // Arrange
      const input = ['START-ONB-CNB', 'Confirm-Data'];

      // Act
      const result = findMissingStrings(input);

      // Assert
      expect(result).toContain('start-onb-cnb');
      expect(result).toContain('confirm-data');
    });

    it('should handle null or undefined input by treating it as empty array', () => {
      // Arrange & Act
      const resultNull = findMissingStrings(null as any);
      const resultUndefined = findMissingStrings(undefined as any);

      // Assert
      expect(resultNull).toEqual(allSteps);
      expect(resultUndefined).toEqual(allSteps);
    });

    it('should handle input with duplicate values', () => {
      // Arrange
      const input = [
        'start-onb-cnb',
        'start-onb-cnb',
        'confirm-data',
        'confirm-data',
      ];
      const expected = ['accept-billing', 'accept-contract', 'sign-contract'];

      // Act
      const result = findMissingStrings(input);

      // Assert
      expect(result).toEqual(expected);
    });
  });
});
