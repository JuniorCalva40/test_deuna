import { GenerateDocumentUseCase } from './generate-document.use-case';
import { FileGeneratorPort } from '../ports/out/repository/file-generator.port.interface';
import { FileManagerPort } from '../ports/out/repository/file-manager.port.interface';
import {
  FileGenerationError,
  FileStorageError,
} from '../errors/document-generation-errors';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('GenerateDocumentUseCase', () => {
  let useCase: GenerateDocumentUseCase;
  let mockFileGeneratorPort: jest.Mocked<FileGeneratorPort>;
  let mockFileManagerPort: jest.Mocked<FileManagerPort>;

  beforeEach(() => {
    mockFileGeneratorPort = {
      generateFile: jest.fn(),
    };
    mockFileManagerPort = {
      storeFile: jest.fn(),
    };
    useCase = new GenerateDocumentUseCase(
      mockFileGeneratorPort,
      mockFileManagerPort,
    );
  });

  it('should generate and store a document successfully', async () => {
    const mockTrackingId = '8cd537c8-0b03-403d-bce9-e1b77e815a06';
    (uuidv4 as jest.Mock).mockReturnValue(mockTrackingId);

    const mockGenerateFileResponse = {
      b64encoded: 'base64string',
      presignedUrl: 'http://example.com/generated-file',
    };
    const mockStoreFileResponse = {
      signedUrl: 'http://example.com/stored-file',
    };

    mockFileGeneratorPort.generateFile.mockResolvedValue(
      mockGenerateFileResponse,
    );
    mockFileManagerPort.storeFile.mockResolvedValue(mockStoreFileResponse);

    const result = await useCase.execute({
      commerceId: 'commerce-id',
      htmlTemplate: '<html></html>',
      description: 'Test document',
      identification: '123456',
      fileName: 'test.pdf',
      processName: 'test-process',
      mimeType: 'application/pdf',
      extension: 'pdf',
      tags: ['tag1', 'tag2'],
    });

    expect(result).toEqual({
      signedUrl: 'http://example.com/stored-file',
      base64: undefined,
      fileName: 'test.pdf',
      processName: 'test-process',
      tags: ['tag1', 'tag2'],
      mimeType: 'application/pdf',
      extension: 'pdf',
      trackingId: mockTrackingId,
    });

    expect(mockFileGeneratorPort.generateFile).toHaveBeenCalled();
    expect(mockFileManagerPort.storeFile).toHaveBeenCalled();
  });

  it('should throw FileGenerationError when file generation fails', async () => {
    mockFileGeneratorPort.generateFile.mockRejectedValue(
      new Error('Generation failed'),
    );

    await expect(
      useCase.execute({
        commerceId: 'commerce-id',
        htmlTemplate: '<html></html>',
        description: 'Test document',
        identification: '123456',
        fileName: 'test.pdf',
        processName: 'test-process',
        mimeType: 'application/pdf',
        extension: 'pdf',
        tags: ['tag1', 'tag2'],
      }),
    ).rejects.toThrow(FileGenerationError);
  });

  it('should throw FileStorageError when file storage fails', async () => {
    const mockGenerateFileResponse = {
      b64encoded: 'base64string',
      presignedUrl: 'http://example.com/generated-file',
      message: 'File generated successfully',
    };

    mockFileGeneratorPort.generateFile.mockResolvedValue(
      mockGenerateFileResponse,
    );
    mockFileManagerPort.storeFile.mockRejectedValue(
      new Error('Storage failed'),
    );

    await expect(
      useCase.execute({
        commerceId: 'commerce-id',
        htmlTemplate: '<html></html>',
        description: 'Test document',
        identification: '123456',
        fileName: 'test.pdf',
        processName: 'test-process',
        mimeType: 'application/pdf',
        extension: 'pdf',
        tags: ['tag1', 'tag2'],
      }),
    ).rejects.toThrow(FileStorageError);
  });
});
