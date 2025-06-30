import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { QueryDocumentService } from './query-document.service';
import { QueryDocumentInput } from '../dto/query-document-input.dto';
import { QueryDocumentResponse } from '../dto/query-document-response.dto';
import { MSA_NB_CNB_ORQ_SERVICE } from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';

describe('QueryDocumentService', () => {
  let service: QueryDocumentService;
  let mockCnbOrqService: jest.Mocked<any>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    mockCnbOrqService = {
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
          provide: MSA_NB_CNB_ORQ_SERVICE,
          useValue: mockCnbOrqService,
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

  describe('buildDocumentRequest', () => {
    it('should build correct document request', () => {
      const input: QueryDocumentInput = { templateName: 'test-doc' };
      const result = (service as any).buildDocumentRequest(input);

      expect(result).toEqual({
        templateName: 'test-doc',
        templatePath: 'cnb/documents/test-doc.html',
      });
    });
  });

  describe('validateInput', () => {
    it('should throw error when input is null', async () => {
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Template name is required');
      });

      await expect((service as any).validateInput(null)).rejects.toThrow(
        'Template name is required',
      );
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.DOC_FORMAT_INVALID,
          message: 'Template name is required',
        },
        'document',
      );
    });

    it('should throw error when templateName is not a string', async () => {
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Template name must be a string');
      });

      const invalidInput = { templateName: 123 };
      await expect(
        (service as any).validateInput(invalidInput),
      ).rejects.toThrow('Template name must be a string');
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.DOC_FORMAT_INVALID,
          message: 'Template name must be a string',
        },
        'document',
      );
    });
  });

  describe('fetchDocument', () => {
    it('should handle ETIMEDOUT error', async () => {
      const mockError = { code: 'ETIMEDOUT' };
      mockCnbOrqService.queryDocument.mockReturnValue(
        throwError(() => mockError),
      );

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Document service connection timeout');
      });

      await expect(
        (service as any).fetchDocument({ templateName: 'test' }),
      ).rejects.toThrow('Document service connection timeout');
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.SYS_TIMEOUT_EXCEEDED,
          message: 'Document service connection timeout',
          details: mockError,
        },
        'document',
      );
    });

    it('should handle ECONNREFUSED error', async () => {
      const mockError = { code: 'ECONNREFUSED' };
      mockCnbOrqService.queryDocument.mockReturnValue(
        throwError(() => mockError),
      );

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Document service is unavailable');
      });

      await expect(
        (service as any).fetchDocument({ templateName: 'test' }),
      ).rejects.toThrow('Document service is unavailable');
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.SYS_SERVICE_DOWN,
          message: 'Document service is unavailable',
          details: mockError,
        },
        'document',
      );
    });
  });

  describe('validateResponse', () => {
    it('should throw error when response data is missing', async () => {
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Document data is missing or invalid');
      });

      const invalidResponse = { status: 'success' };
      await expect(
        (service as any).validateResponse(invalidResponse),
      ).rejects.toThrow('Document data is missing or invalid');
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.DOC_FORMAT_INVALID,
          message: 'Document data is missing or invalid',
        },
        'document',
      );
    });

    it('should throw error when response data format is invalid', async () => {
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Document response format is invalid');
      });

      const invalidResponse = { data: { onlyPresignedUrl: 'url' } };
      await expect(
        (service as any).validateResponse(invalidResponse),
      ).rejects.toThrow('Document response format is invalid');
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.DOC_RESPONSE_INVALID,
          message: 'Document response format is invalid',
        },
        'document',
      );
    });
  });

  describe('error handling', () => {
    it('should handle HTTP 400 error', async () => {
      const input: QueryDocumentInput = { templateName: 'valid-template' };
      const error = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };

      mockCnbOrqService.queryDocument.mockReturnValue(
        throwError(() => error),
      );

      jest
        .spyOn(ErrorHandler, 'handleError')
        .mockImplementation((errorConfig) => {
          throw new Error(errorConfig.message);
        });

      await expect(service.queryDocument(input)).rejects.toThrow(
        'Invalid document request format',
      );

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.DOC_FORMAT_INVALID,
          message: 'Invalid document request format',
          details: error,
        },
        'document',
      );
    });

    it('should handle HTTP 401 error', async () => {
      const input: QueryDocumentInput = { templateName: 'valid-template' };
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      mockCnbOrqService.queryDocument.mockReturnValue(
        throwError(() => error),
      );

      jest
        .spyOn(ErrorHandler, 'handleError')
        .mockImplementation((errorConfig) => {
          throw new Error(errorConfig.message);
        });

      await expect(service.queryDocument(input)).rejects.toThrow(
        'Authentication failed for document service',
      );

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.AUTH_TOKEN_INVALID,
          message: 'Authentication failed for document service',
          details: error,
        },
        'document',
      );
    });

    it('should handle HTTP 413 error', async () => {
      const input: QueryDocumentInput = { templateName: 'valid-template' };
      const error = {
        response: {
          status: 413,
          data: { message: 'Payload Too Large' },
        },
      };

      mockCnbOrqService.queryDocument.mockReturnValue(
        throwError(() => error),
      );

      jest
        .spyOn(ErrorHandler, 'handleError')
        .mockImplementation((errorConfig) => {
          throw new Error(errorConfig.message);
        });

      await expect(service.queryDocument(input)).rejects.toThrow(
        'Document size limit exceeded',
      );

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.DOC_SIZE_EXCEEDED,
          message: 'Document size limit exceeded',
          details: error,
        },
        'document',
      );
    });

    it('should handle server errors (500+)', async () => {
      const input: QueryDocumentInput = { templateName: 'valid-template' };
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };

      mockCnbOrqService.queryDocument.mockReturnValue(
        throwError(() => error),
      );

      jest
        .spyOn(ErrorHandler, 'handleError')
        .mockImplementation((errorConfig) => {
          throw new Error(errorConfig.message);
        });

      await expect(service.queryDocument(input)).rejects.toThrow(
        'Document service is currently unavailable',
      );

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.SYS_SERVICE_DOWN,
          message: 'Document service is currently unavailable',
          details: error,
        },
        'document',
      );
    });

    it('should handle unknown HTTP status', async () => {
      const input: QueryDocumentInput = { templateName: 'valid-template' };
      const error = {
        response: {
          status: 418, // I'm a teapot
          data: { message: "I'm a teapot" },
        },
      };

      mockCnbOrqService.queryDocument.mockReturnValue(
        throwError(() => error),
      );

      jest
        .spyOn(ErrorHandler, 'handleError')
        .mockImplementation((errorConfig) => {
          throw new Error(errorConfig.message);
        });

      await expect(service.queryDocument(input)).rejects.toThrow(
        'Unexpected error while processing document',
      );

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.SYS_PROCESS_FAILED,
          message: 'Unexpected error while processing document',
          details: error,
        },
        'document',
      );
    });
  });

  describe('queryDocument', () => {
    const mockResponse: QueryDocumentResponse = {
      status: 'SUCCESS',
      message: 'Document query successful',
      data: {
        presignedUrl: 'https://example.com/document',
        b64encoded: undefined,
      },
    };

    beforeEach(() => {
      jest.spyOn(service as any, 'validateInput').mockResolvedValue(true);
    });

    it('should return success response when document is queried successfully', async () => {
      const input: QueryDocumentInput = { templateName: 'valid-template' };

      mockCnbOrqService.queryDocument.mockReturnValue(of(mockResponse));

      jest.spyOn(service as any, 'validateResponse').mockResolvedValue(true);

      const result = await service.queryDocument(input);

      expect(result).toEqual(mockResponse);
      expect(mockCnbOrqService.queryDocument).toHaveBeenCalledWith({
        templateName: 'valid-template',
        templatePath: 'cnb/documents/valid-template.html',
      });
    });

    it('should throw error when document service returns null', async () => {
      const input: QueryDocumentInput = { templateName: 'valid-template' };
      mockCnbOrqService.queryDocument.mockReturnValue(of(null));

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Document template not found');
      });

      await expect(service.queryDocument(input)).rejects.toThrow(
        'Document template not found',
      );
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.DOC_TYPE_INVALID,
          message: 'Document template not found',
        },
        'document',
      );
    });

    it('should handle error when document service throws an error', async () => {
      const input: QueryDocumentInput = { templateName: 'valid-template' };
      const mockError = new Error('Service error');
      mockCnbOrqService.queryDocument.mockReturnValue(
        throwError(() => mockError),
      );

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Service error');
      });

      await expect(service.queryDocument(input)).rejects.toThrow(
        'Service error',
      );
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.SYS_ERROR_UNKNOWN,
          message: 'Service error',
          details: mockError,
        },
        'document',
      );
    });
  });
});
