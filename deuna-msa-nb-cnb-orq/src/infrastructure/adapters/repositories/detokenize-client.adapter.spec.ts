import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { DetokenizeClientAdapter } from './detokenize-client.adapter';
import { DetokenizeRequestDto } from '../../../application/dto/detokenize/detokenize-request.dto';
import { Logger } from '@deuna/tl-logger-nd';

// Simulate the formatLogger for the tests
jest.mock('../../../domain/utils/format-logger', () => ({
  formatLogger: jest.fn((logger, type, message) => {
    if (type === 'info') {
      logger.log(message);
    } else if (type === 'error') {
      logger.error(message);
    } else if (type === 'warn') {
      logger.warn(message);
    }
  }),
}));

describe('DetokenizeClientAdapter', () => {
  let adapter: DetokenizeClientAdapter;
  let httpServiceMock: jest.Mocked<HttpService>;
  let configServiceMock: jest.Mocked<ConfigService>;
  let loggerMock: jest.Mocked<Logger>;

  const mockTrackingData = {
    sessionId: 'test-session-id',
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
  };

  const mockRequest = new DetokenizeRequestDto();
  mockRequest.bestImageToken = 'test-token-value';

  const mockApiUrl = 'http://mock-kyc-service.com';

  beforeEach(async () => {
    httpServiceMock = {
      post: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    configServiceMock = {
      get: jest.fn().mockReturnValue(mockApiUrl),
    } as unknown as jest.Mocked<ConfigService>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DetokenizeClientAdapter,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    adapter = module.get<DetokenizeClientAdapter>(DetokenizeClientAdapter);
    // Reemplazar el logger interno con nuestro mock
    (adapter as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should initialize with the correct API URL from config', () => {
    expect(configServiceMock.get).toHaveBeenCalledWith('MSA_TL_KYC_URL');
    expect((adapter as any).apiUrl).toBe(mockApiUrl);
  });

  describe('detokenizeImage', () => {
    it('should successfully detokenize an image with valid response', async () => {
      // Mock response with valid imageBuffer
      const mockResponse: AxiosResponse = {
        data: {
          imageBuffer: 'base64-image-data',
          status: 'success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.post.mockReturnValue(of(mockResponse));

      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      expect(httpServiceMock.post).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/kyc/images/detokenize`,
        mockRequest,
        {
          headers: {
            sessionId: mockTrackingData.sessionId,
            trackingId: mockTrackingData.trackingId,
            requestId: mockTrackingData.requestId,
            'Content-Type': 'application/json',
          },
        },
      );

      expect(result).toEqual({
        imageData: 'base64-image-data',
        status: 'SUCCESS',
        message: 'Image detokenized successfully',
      });
    });

    it('should return error when response does not contain imageBuffer', async () => {
      // Mock response without imageBuffer
      const mockResponse: AxiosResponse = {
        data: {
          someOtherField: 'some-value',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.post.mockReturnValue(of(mockResponse));

      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      expect(result).toEqual({
        status: 'ERROR',
        message:
          'Failed to detokenize image: Invalid response format - imageBuffer not found',
      });
      // Verify that log was called instead of warn, since formatLogger with type 'info' uses logger.log
      expect(loggerMock.log).toHaveBeenCalled();
    });

    it('should handle connection refused error', async () => {
      // Create a mock AxiosError with ECONNREFUSED code
      const error = new Error('Connection refused') as AxiosError;
      error.code = 'ECONNREFUSED';
      error.isAxiosError = true;

      httpServiceMock.post.mockReturnValue(throwError(() => error));

      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      expect(result.status).toBe('ERROR');
      expect(result.message).toContain('Connection refused');
    });

    it('should handle connection timeout error', async () => {
      // Create a mock AxiosError with timeout code
      const error = new Error('Timeout') as AxiosError;
      error.code = 'ETIMEDOUT';
      error.isAxiosError = true;

      httpServiceMock.post.mockReturnValue(throwError(() => error));

      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      expect(result.status).toBe('ERROR');
      expect(result.message).toContain('Connection timeout');
    });

    it('should handle DNS resolution error', async () => {
      // Create a mock AxiosError with DNS resolution error code
      const error = new Error('DNS resolution failed') as AxiosError;
      error.code = 'EAI_AGAIN';
      error.isAxiosError = true;

      httpServiceMock.post.mockReturnValue(throwError(() => error));

      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      expect(result.status).toBe('ERROR');
      expect(result.message).toContain('DNS resolution error');
    });

    it('should handle HTTP error response', async () => {
      // Create a mock AxiosError with response
      const error = new Error('HTTP Error') as AxiosError;
      error.isAxiosError = true;
      error.response = {
        data: { message: 'Invalid token' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.post.mockReturnValue(throwError(() => error));

      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      expect(result.status).toBe('ERROR');
      expect(result.message).toContain('HTTP error 400');
    });

    it('should handle no response error', async () => {
      // Create a mock AxiosError with request but no response
      const error = new Error('No response') as AxiosError;
      error.isAxiosError = true;
      error.request = {}; // Just needs to exist
      error.response = undefined;

      httpServiceMock.post.mockReturnValue(throwError(() => error));

      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      expect(result.status).toBe('ERROR');
      expect(result.message).toContain('No response received');
    });

    it('should handle general communication error', async () => {
      // Create a mock error without specific axios properties
      const error = new Error('General error');

      httpServiceMock.post.mockReturnValue(throwError(() => error));

      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      expect(result.status).toBe('ERROR');
      expect(result.message).toContain(
        'Error communicating with detokenize service',
      );
    });

    it('should handle unexpected error that is not one of the custom error types', async () => {
      // Create an error that is not one of the specific types
      class CustomUnexpectedError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomUnexpectedError';
        }
      }

      const unexpectedError = new CustomUnexpectedError(
        'Unexpected error occurred',
      );

      // Simulate that this error is thrown from the post method
      httpServiceMock.post.mockReturnValue(throwError(() => unexpectedError));

      // Execute the method
      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      // Verify the expected behavior
      expect(result.status).toBe('ERROR');
      expect(result.message).toBe(
        'Error communicating with detokenize service: Unexpected error occurred',
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });

    it('should handle custom error type thrown by the service', async () => {
      // Mock the code to throw another type of custom error that is not HttpResponseError
      class NonHttpError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'NonHttpError';
        }
      }

      const mockNonHttpError = new NonHttpError('Non-HTTP error');

      // do this to pass the instanceof check but not be one of the specific errors
      Object.setPrototypeOf(mockNonHttpError, Error.prototype);

      // Simulate that this error is thrown from the post method
      httpServiceMock.post.mockReturnValue(throwError(() => mockNonHttpError));

      // Execute the method
      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      // Verify that the generic error message is returned
      expect(result.status).toBe('ERROR');
      expect(result.message).toBe(
        'Error communicating with detokenize service: Non-HTTP error',
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });

    it('should throw error if API URL is not configured', async () => {
      // Mock configService to return undefined for API URL
      configServiceMock.get.mockReturnValueOnce(undefined);

      expect(() => {
        new DetokenizeClientAdapter(httpServiceMock, configServiceMock);
      }).toThrow('API URL for KYC service (MSA_TL_KYC_URL) is not configured');
    });

    it('should handle error that is not a custom error type and format the message correctly', async () => {
      // Create a standard error class that is not any of the specific instances
      const regularError = new Error('Simple regular error');

      // Simulate that the httpService.post throws this error
      httpServiceMock.post.mockImplementation(() => {
        throw regularError; // Throw directly instead of using throwError
      });

      // Execute the method
      const result = await adapter.detokenizeImage(
        mockRequest,
        mockTrackingData,
      );

      // Verify that it passes through the else branch (line 191)
      expect(result.status).toBe('ERROR');
      expect(result.message).toBe(
        'Failed to detokenize image: Simple regular error',
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });
});
