import { toTitleCase } from './string.util';

describe('StringUtil', () => {
  describe('toTitleCase', () => {
    it('should convert a lowercase string to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should convert an uppercase string to title case', () => {
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
    });

    it('should convert a mixed-case string to title case', () => {
      expect(toTitleCase('hELLo wORLd')).toBe('Hello World');
    });

    it('should handle single word strings', () => {
      expect(toTitleCase('hello')).toBe('Hello');
    });

    it('should return an empty string if input is empty', () => {
      expect(toTitleCase('')).toBe('');
    });

    it('should handle strings with leading/trailing spaces (though current implementation does not trim)', () => {
      expect(toTitleCase('  hello world  ')).toBe('  Hello World  ');
    });

    it('should handle strings with numbers and special characters', () => {
      expect(toTitleCase('hello 123 world!')).toBe('Hello 123 World!');
    });

    it('should handle strings that are already in title case', () => {
      expect(toTitleCase('Hello World')).toBe('Hello World');
    });

    it('should handle strings with multiple spaces between words', () => {
      expect(toTitleCase('hello   world')).toBe('Hello   World');
    });
  });
});
