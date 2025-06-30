import { Test, TestingModule } from '@nestjs/testing';
import { UploadClientsFileService } from './upload-clients-file.service';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { of, throwError } from 'rxjs';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ApolloError } from 'apollo-server-express';

describe('UploadClientsFileService', () => {
  let service: UploadClientsFileService;
  let mockMsaNbClientService: jest.Mocked<any>;

  const mockFile = {
    createReadStream: jest.fn(),
    mimetype: 'text/csv',
    filename: 'test.csv',
  };

  const mockFileContent = Buffer.from('test,data,content');

  beforeEach(async () => {
    mockMsaNbClientService = {
      uploadClientsFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadClientsFileService,
        {
          provide: MSA_NB_CLIENT_SERVICE,
          useValue: mockMsaNbClientService,
        },
      ],
    }).compile();

    service = module.get<UploadClientsFileService>(UploadClientsFileService);

    jest.spyOn(ErrorHandler, 'handleError').mockImplementation((error) => {
      throw new ApolloError(error.message, error.code, {
        errorResponse: {
          status: 'ERROR',
          errors: [
            {
              code: error.code,
              message: error.message,
              context: 'upload-clients-file',
              details: error.details,
            },
          ],
        },
      });
    });

    mockFile.createReadStream.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield mockFileContent;
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Successful Upload', () => {
    it('should process a valid file successfully', async () => {
      const mockResponse = {
        totalProcessed: 100,
        skippedRecords: [],
      };
      mockMsaNbClientService.uploadClientsFile.mockReturnValue(of(mockResponse));

      const result = await service.uploadClientsFile(
        Promise.resolve(mockFile as any),
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.totalProcessed).toBe(mockResponse.totalProcessed);
      const expectedBase64 = mockFileContent.toString('base64');
      expect(mockMsaNbClientService.uploadClientsFile).toHaveBeenCalledWith(
        expectedBase64,
      );
    });
  });

  describe('File Validation Failures', () => {
    it('should throw an error if the file is null or undefined', async () => {
      await expect(service.uploadClientsFile(null)).rejects.toThrow(
        ApolloError,
      );
      await expect(service.uploadClientsFile(undefined)).rejects.toThrow(
        ApolloError,
      );
    });

    it('should throw an error for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };
      await expect(
        service.uploadClientsFile(Promise.resolve(invalidFile as any)),
      ).rejects.toThrow(ApolloError);
    });

    it('should throw an error for an empty file', async () => {
      const emptyFile = {
        ...mockFile,
        createReadStream: jest.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from('');
          },
        }),
      };
      await expect(
        service.uploadClientsFile(Promise.resolve(emptyFile as any)),
      ).rejects.toThrow(ApolloError);
    });
  });

  describe('File Streaming Failures', () => {
    it('should throw an error if file size exceeds the limit', async () => {
      const largeContent = Buffer.alloc(6 * 1024 * 1024); // 6MB
      const largeFile = {
        ...mockFile,
        createReadStream: jest.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield largeContent;
          },
        }),
      };
      await expect(
        service.uploadClientsFile(Promise.resolve(largeFile as any)),
      ).rejects.toThrow(ApolloError);
    });

    it('should handle generic stream reading errors', async () => {
      const streamError = new Error('A stream error occurred');
      const errorFile = {
        ...mockFile,
        createReadStream: jest.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield mockFileContent;
            throw streamError;
          },
        }),
      };

      await expect(
        service.uploadClientsFile(Promise.resolve(errorFile as any)),
      ).rejects.toThrow(ApolloError);
    });
  });

  describe('Service Call Failures', () => {
    it('should handle a null response from the client service', async () => {
      mockMsaNbClientService.uploadClientsFile.mockReturnValue(of(null));
      await expect(
        service.uploadClientsFile(Promise.resolve(mockFile as any)),
      ).rejects.toThrow(ApolloError);
    });

    it('should handle an error with a code from the client service', async () => {
      const serviceError = {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The downstream service is down',
      };
      mockMsaNbClientService.uploadClientsFile.mockReturnValue(
        throwError(() => serviceError),
      );
      await expect(
        service.uploadClientsFile(Promise.resolve(mockFile as any)),
      ).rejects.toThrow(ApolloError);
    });

    it('should handle a generic error from the client service', async () => {
      const genericError = new Error('Internal Server Error');
      mockMsaNbClientService.uploadClientsFile.mockReturnValue(
        throwError(() => genericError),
      );
      await expect(
        service.uploadClientsFile(Promise.resolve(mockFile as any)),
      ).rejects.toThrow(ApolloError);
    });
  });
});
