import { Test, TestingModule } from '@nestjs/testing';
import { QueryDocumentService } from './query-document.service';
import { QueryDocumentDto } from '../dto/query-document.dto';
import { QueryDocumentUseCase } from '../use-cases/query-document.use-case';

jest.mock('../use-cases/query-document.use-case');

describe('QueryDocumentService', () => {
  let service: QueryDocumentService;
  let mockQueryDocumentUseCase: jest.Mocked<QueryDocumentUseCase>;

  beforeEach(async () => {
    mockQueryDocumentUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: QueryDocumentService,
          useFactory: () => {
            return new QueryDocumentService(
              {} as any, // mock TemplateGeneratorPort
              {} as any, // mock FileGeneratorPort
            );
          },
        },
      ],
    }).compile();

    service = module.get<QueryDocumentService>(QueryDocumentService);
    // Reemplazar la instancia de QueryDocumentUseCase en el servicio
    (service as any).queryDocumentUseCase = mockQueryDocumentUseCase;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queryDocument', () => {
    it('should query and generate a document successfully', async () => {
      const dto: QueryDocumentDto = {
        templateName: 'test-template',
        templatePath: '/path/to/template',
      };

      const mockResult = {
        presignedUrl: 'http://example.com/document',
        b64encoded: 'base64encodedstring',
      };

      mockQueryDocumentUseCase.execute.mockResolvedValue(mockResult);

      const result = await service.queryDocument(dto);

      expect(result).toEqual(mockResult);
      expect(mockQueryDocumentUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('should throw an error when document generation fails', async () => {
      const dto: QueryDocumentDto = {
        templateName: 'test-template',
        templatePath: '/path/to/template',
      };

      const mockError = new Error('Document generation failed');
      mockQueryDocumentUseCase.execute.mockRejectedValue(mockError);

      await expect(service.queryDocument(dto)).rejects.toThrow(
        'Document generation failed',
      );
    });
  });
});
