import {
  FileGenerationError,
  FileStorageError,
} from './document-generation-errors';

describe('Document Generation Errors', () => {
  describe('FileGenerationError', () => {
    it('should create a FileGenerationError with the correct message and name', () => {
      const errorMessage = 'Failed to generate file';
      const error = new FileGenerationError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FileGenerationError);
      expect(error.message).toBe(`Error generating file: ${errorMessage}`);
      expect(error.name).toBe('FileGenerationError');
    });
  });

  describe('FileStorageError', () => {
    it('should create a FileStorageError with the correct message and name', () => {
      const errorMessage = 'Failed to store file';
      const error = new FileStorageError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FileStorageError);
      expect(error.message).toBe(`Error storing file: ${errorMessage}`);
      expect(error.name).toBe('FileStorageError');
    });
  });

  describe('Error inheritance', () => {
    it('should allow catching FileGenerationError as an Error', () => {
      const error = new FileGenerationError('Test error');
      expect(() => {
        throw error;
      }).toThrow(Error);
    });

    it('should allow catching FileStorageError as an Error', () => {
      const error = new FileStorageError('Test error');
      expect(() => {
        throw error;
      }).toThrow(Error);
    });
  });
});
