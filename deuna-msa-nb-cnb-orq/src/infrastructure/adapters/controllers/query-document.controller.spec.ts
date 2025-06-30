import { Test, TestingModule } from '@nestjs/testing';
import { QueryDocumentController } from './query-document.controller';
import { QueryDocumentServicePort } from '../../../application/ports/in/services/query-document.service.port.interface';
import { QueryDocumentDto } from '../../../application/dto/query-document.dto';

describe('QueryDocumentController', () => {
  let controller: QueryDocumentController;
  let mockQueryDocumentService: jest.Mocked<QueryDocumentServicePort>;

  beforeEach(async () => {
    mockQueryDocumentService = {
      queryDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueryDocumentController],
      providers: [
        {
          provide: 'QueryDocumentServicePort',
          useValue: mockQueryDocumentService,
        },
      ],
    }).compile();

    controller = module.get<QueryDocumentController>(QueryDocumentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('queryDocument', () => {
    it('should generate a document successfully', async () => {
      const queryDocumentDto: QueryDocumentDto = {
        templateName: 'test-template',
        templatePath: '/path/to/template',
      };

      const mockResult = {
        presignedUrl: 'mocked-presigned-url',
        b64encoded: 'mocked-base64-document',
      };

      mockQueryDocumentService.queryDocument.mockResolvedValue(mockResult);

      const result = await controller.queryDocument(queryDocumentDto);

      expect(result).toEqual({
        status: 'success',
        message: 'Documento generado con éxito',
        data: mockResult,
      });

      expect(mockQueryDocumentService.queryDocument).toHaveBeenCalledWith(
        queryDocumentDto,
      );
    });

    it('should handle errors from service', async () => {
      const queryDocumentDto: QueryDocumentDto = {
        templateName: 'test-template',
        templatePath: '/path/to/template',
      };

      const mockError = new Error('Test error');
      mockQueryDocumentService.queryDocument.mockRejectedValue(mockError);

      await expect(controller.queryDocument(queryDocumentDto)).rejects.toThrow(
        'Test error',
      );
    });
  });
});
