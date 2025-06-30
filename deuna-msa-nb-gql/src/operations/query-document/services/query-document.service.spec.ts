import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { QueryDocumentService } from './query-document.service';
import { QueryDocumentInput } from '../dto/query-document-input.dto';
import { QueryDocumentResponse } from '../dto/query-document-response.dto';
import { MSA_CO_DOCUMENT_SERVICE } from '../../../external-services/msa-co-document/providers/msa-co-document.provider';
import { ErrorHandler } from '../../../utils/error-handler.util';

describe('QueryDocumentService', () => {
  let service: QueryDocumentService;
  let mockMsaCoDocumentService: jest.Mocked<any>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    mockMsaCoDocumentService = {
      queryDocument: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryDocumentService,
        {
          provide: MSA_CO_DOCUMENT_SERVICE,
          useValue: mockMsaCoDocumentService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<QueryDocumentService>(QueryDocumentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queryDocument', () => {
    const mockResponse: QueryDocumentResponse = {
      status: 'success',
      message: 'Document queried successfully',
      data: {
        presignedUrl: 'https://example.com/document',
        b64encoded: 'base64EncodedString',
      },
    };

    it('should handle empty templateName', async () => {
      const emptyInput: QueryDocumentInput = { templateName: '' };
      mockMsaCoDocumentService.queryDocument.mockReturnValue(of(mockResponse));

      await service.queryDocument(emptyInput);

      expect(mockMsaCoDocumentService.queryDocument).toHaveBeenCalledWith({
        templateName: '',
        templatePath: 'onboarding/documents/.html',
      });
    });

    it('should handle special characters in templateName', async () => {
      const specialInput: QueryDocumentInput = {
        templateName: 'special@#$%^&*',
      };
      mockMsaCoDocumentService.queryDocument.mockReturnValue(of(mockResponse));

      await service.queryDocument(specialInput);

      expect(mockMsaCoDocumentService.queryDocument).toHaveBeenCalledWith({
        templateName: 'special@#$%^&*',
        templatePath: 'onboarding/documents/special@#$%^&*.html',
      });
    });
  });

  describe('QueryDocumentService', () => {
    let service: QueryDocumentService;
    let mockMsaCoDocumentService: jest.Mocked<any>;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(async () => {
      mockMsaCoDocumentService = {
        queryDocument: jest.fn(),
      };

      mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          QueryDocumentService,
          {
            provide: MSA_CO_DOCUMENT_SERVICE,
            useValue: mockMsaCoDocumentService,
          },
          {
            provide: Logger,
            useValue: mockLogger,
          },
        ],
      }).compile();

      service = module.get<QueryDocumentService>(QueryDocumentService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('queryDocument', () => {
      const mockResponse: QueryDocumentResponse = {
        status: 'SUCCESS',
        message: 'Documento consultado correctamente',
        data: {
          presignedUrl: 'https://example.com/document',
          b64encoded: 'base64EncodedString',
        },
      };

      it('should handle empty templateName', async () => {
        const emptyInput: QueryDocumentInput = { templateName: '' };
        mockMsaCoDocumentService.queryDocument.mockReturnValue(
          of(mockResponse),
        );

        await service.queryDocument(emptyInput);

        expect(mockMsaCoDocumentService.queryDocument).toHaveBeenCalledWith({
          templateName: '',
          templatePath: 'onboarding/documents/.html',
        });
      });

      it('should handle special characters in templateName', async () => {
        const specialInput: QueryDocumentInput = {
          templateName: 'special@#$%^&*',
        };
        mockMsaCoDocumentService.queryDocument.mockReturnValue(
          of(mockResponse),
        );

        await service.queryDocument(specialInput);

        expect(mockMsaCoDocumentService.queryDocument).toHaveBeenCalledWith({
          templateName: 'special@#$%^&*',
          templatePath: 'onboarding/documents/special@#$%^&*.html',
        });
      });

      it('should return success response when document is queried successfully', async () => {
        const input: QueryDocumentInput = { templateName: 'test-template' };
        mockMsaCoDocumentService.queryDocument.mockReturnValue(
          of(mockResponse),
        );

        const result = await service.queryDocument(input);

        expect(result).toEqual(mockResponse);
      });

      it('should handle error when queryDocument returns null', async () => {
        const input: QueryDocumentInput = { templateName: 'test-template' };
        mockMsaCoDocumentService.queryDocument.mockReturnValue(of(null));

        jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
          throw new Error('Mocked error');
        });

        await expect(service.queryDocument(input)).rejects.toThrow(
          'Mocked error',
        );
        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          'Fail! Querying document with templateName: test-template',
          'query-document',
        );
      });

      it('should handle error when queryDocument throws an exception', async () => {
        const input: QueryDocumentInput = { templateName: 'test-template' };
        const mockError = new Error('Test error');
        mockMsaCoDocumentService.queryDocument.mockReturnValue(
          throwError(() => mockError),
        );

        jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
          throw new Error('Mocked error');
        });

        await expect(service.queryDocument(input)).rejects.toThrow(
          'Mocked error',
        );
        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          mockError,
          'query-document',
        );
      });
    });
  });
});
