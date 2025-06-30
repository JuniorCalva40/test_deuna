import { Test, TestingModule } from '@nestjs/testing';
import { DocumentGenerationService } from '../../application/services/document-generation.service';
import { FileGeneratorPort } from '../../application/ports/out/repository/file-generator.port.interface';
import { FileManagerPort } from '../../application/ports/out/repository/file-manager.port.interface';
import { GenerateDocumentDto } from '../../application/dto/generate-document.dto';
import { GenerateDocumentUseCase } from '../../application/use-cases/generate-document.use-case';

jest.mock('@src/application/use-cases/generate-document.use-case');

describe('DocumentGenerationService', () => {
  let service: DocumentGenerationService;
  let mockFileGeneratorPort: jest.Mocked<FileGeneratorPort>;
  let mockFileManagerPort: jest.Mocked<FileManagerPort>;
  let mockGenerateDocumentUseCase: jest.Mocked<GenerateDocumentUseCase>;

  beforeEach(async () => {
    mockFileGeneratorPort = {
      generateFile: jest.fn(),
    };
    mockFileManagerPort = {
      storeFile: jest.fn(),
    };
    mockGenerateDocumentUseCase = {
      execute: jest.fn(),
    } as any;

    (GenerateDocumentUseCase as jest.Mock).mockImplementation(
      () => mockGenerateDocumentUseCase,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentGenerationService,
        { provide: 'FileGeneratorPort', useValue: mockFileGeneratorPort },
        { provide: 'FileManagerPort', useValue: mockFileManagerPort },
      ],
    }).compile();

    service = module.get<DocumentGenerationService>(DocumentGenerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAndSendDocument', () => {
    it('should generate and send a document successfully', async () => {
      const dto: GenerateDocumentDto = {
        commerceId: '123',
        htmlTemplate: '<html></html>',
        description: 'Test document',
        identification: '12345',
        fileName: 'test.pdf',
        processName: 'test-process',
        mimeType: 'application/pdf',
        extension: 'pdf',
        tags: ['test'],
      };

      const mockResult = {
        signedUrl: 'http://example.com/stored-file',
        base64: 'base64encodedstring',
        fileName: 'test.pdf',
        processName: 'test-process',
        tags: ['test'],
        mimeType: 'application/pdf',
        extension: 'pdf',
        trackingId: 'mock-tracking-id',
      };

      mockGenerateDocumentUseCase.execute.mockResolvedValue(mockResult);

      const result = await service.generateAndSendDocument(dto);

      expect(result).toEqual({
        signedUrl: 'http://example.com/stored-file',
        base64: 'base64encodedstring',
      });

      expect(mockGenerateDocumentUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });
});
