import { Test, TestingModule } from '@nestjs/testing';
import { DocumentGenerationController } from './document-generation.controller';
import { DocumentGenerationServicePort } from 'src/application/ports/in/services/document-generation.service.port.interface';
import { GenerateDocumentDto } from '../../../application/dto/generate-document.dto';

describe('DocumentGenerationController', () => {
  let controller: DocumentGenerationController;
  let documentGenerationService: jest.Mocked<DocumentGenerationServicePort>;

  beforeEach(async () => {
    const mockDocumentGenerationService = {
      generateAndSendDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentGenerationController],
      providers: [
        {
          provide: 'DocumentGenerationPort',
          useValue: mockDocumentGenerationService,
        },
      ],
    }).compile();

    controller = module.get<DocumentGenerationController>(
      DocumentGenerationController,
    );
    documentGenerationService = module.get('DocumentGenerationPort');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateDocument', () => {
    it('should generate a document successfully', async () => {
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
        signedUrl: 'http://example.com/file.pdf',
        base64: 'base64encodedstring',
      };

      documentGenerationService.generateAndSendDocument.mockResolvedValue(
        mockResult,
      );

      const result = await controller.generateDocument(dto);

      expect(result).toEqual({
        status: 'success',
        message: 'Documento generado y almacenado con éxito',
        data: [
          {
            ...mockResult,
            fileName: dto.fileName,
            processName: dto.processName,
            tags: dto.tags,
          },
        ],
      });

      expect(
        documentGenerationService.generateAndSendDocument,
      ).toHaveBeenCalledWith(dto);
    });

    it('should handle errors', async () => {
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

      const error = new Error('Test error');
      documentGenerationService.generateAndSendDocument.mockRejectedValue(
        error,
      );

      await expect(controller.generateDocument(dto)).rejects.toThrow(
        'Test error',
      );
    });
  });
});
