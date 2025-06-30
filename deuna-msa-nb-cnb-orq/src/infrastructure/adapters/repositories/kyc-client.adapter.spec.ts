import { Test, TestingModule } from '@nestjs/testing';
import { KycClientAdapter } from './kyc-client.adapter';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ValidationStatus } from '../../../domain/entities/validation-status.enum';
import { FacialValidationDto } from '../../../application/dto/facial-validation.dto';
import { LivenessValidationDto } from '../../../application/dto/liveness-validation.dto';
import { ValidationResult } from '../../../application/ports/out/clients/kyc-client.port';

describe('KycClientAdapter', () => {
  let adapter: KycClientAdapter;
  let configServiceMock: jest.Mocked<ConfigService>;
  let httpServiceMock: jest.Mocked<HttpService>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    configServiceMock = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    httpServiceMock = {
      post: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycClientAdapter,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
      ],
    }).compile();

    adapter = module.get<KycClientAdapter>(KycClientAdapter);
    (adapter as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize kycServiceUrl from config', () => {
      // Arrange
      const mockUrl = 'http://kyc-service.example.com';
      configServiceMock.get.mockReturnValue(mockUrl);

      // Act
      const newAdapter = new KycClientAdapter(
        configServiceMock,
        httpServiceMock,
      );

      // Assert
      expect(configServiceMock.get).toHaveBeenCalledWith('MSA_TL_KYC_URL');
      expect((newAdapter as any).kycServiceUrl).toBe(mockUrl);
    });
  });

  describe('validateLiveness', () => {
    it('should call KYC service with correct data and return validation result', async () => {
      // Arrange
      const mockUrl = 'http://kyc-service.example.com';
      (adapter as any).kycServiceUrl = mockUrl;

      const livenessData: LivenessValidationDto = {
        selfieImage: 'base64-selfie-image',
        livenessData: 'base64-liveness-data',
      };

      const headers = {
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
      };

      const mockResponse: AxiosResponse<any> = {
        data: {
          success: true,
          status: ValidationStatus.OK,
          score: 0.95,
          timestamp: '2023-01-01T12:00:00Z',
          details: {
            livenessScore: 0.95,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.post.mockReturnValue(of(mockResponse));

      // Act
      const result = await adapter.validateLiveness(livenessData, headers);

      // Assert
      expect(httpServiceMock.post).toHaveBeenCalledWith(
        `${mockUrl}/api/v1/kyc/liveness-validation`,
        {
          imageBuffer: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        },
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockResponse.data);
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Sending liveness validation request to KYC microservice',
      );
    });

    it('should handle HTTP error and return standardized error response', async () => {
      // Arrange
      const mockUrl = 'http://kyc-service.example.com';
      (adapter as any).kycServiceUrl = mockUrl;

      const livenessData: LivenessValidationDto = {
        selfieImage: 'base64-selfie-image',
        livenessData: 'base64-liveness-data',
      };

      const error = new Error('Network error');
      httpServiceMock.post.mockReturnValue(throwError(() => error));

      // Act
      const result = await adapter.validateLiveness(livenessData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(ValidationStatus.FAIL);
      expect(result.error).toBe('Network error');
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error in liveness validation:',
        error,
      );
    });

    it('should handle non-standard response and transform to standard format', async () => {
      // Arrange
      const mockUrl = 'http://kyc-service.example.com';
      (adapter as any).kycServiceUrl = mockUrl;

      const livenessData: LivenessValidationDto = {
        selfieImage: 'base64-selfie-image',
        livenessData: 'base64-liveness-data',
      };

      const nonStandardResponse: AxiosResponse<any> = {
        data: {
          livenessScore: 0.9,
          passed: true,
          message: 'Liveness check passed',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.post.mockReturnValue(of(nonStandardResponse));

      // Act
      const result = await adapter.validateLiveness(livenessData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe(ValidationStatus.OK);
      expect(result.details).toEqual(nonStandardResponse.data);
    });
  });

  describe('validateFacialMatch', () => {
    it('should call KYC service with correct data and return validation result', async () => {
      // Arrange
      const mockUrl = 'http://kyc-service.example.com';
      (adapter as any).kycServiceUrl = mockUrl;

      const facialData: FacialValidationDto = {
        documentType: 'CEDULA',
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
      };

      const headers = {
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
      };

      const mockResponse: AxiosResponse<any> = {
        data: {
          success: true,
          status: ValidationStatus.OK,
          score: 0.92,
          timestamp: '2023-01-01T12:00:00Z',
          details: {
            faceMatchScore: 0.92,
            documentAuthenticity: 'VALID',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.post.mockReturnValue(of(mockResponse));

      // Act
      const result = await adapter.validateFacialMatch(facialData, headers);

      // Assert
      expect(httpServiceMock.post).toHaveBeenCalledWith(
        `${mockUrl}/api/v1/kyc/facial-validation`,
        {
          documentType: 'CEDULA',
          token1: 'base64-document-image',
          token2: 'base64-selfie-image',
        },
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockResponse.data);
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Sending facial validation request to KYC microservice',
      );
    });

    it('should handle HTTP error and return standardized error response', async () => {
      // Arrange
      const mockUrl = 'http://kyc-service.example.com';
      (adapter as any).kycServiceUrl = mockUrl;

      const facialData: FacialValidationDto = {
        documentType: 'CEDULA',
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
      };

      const error = new Error('Network error');
      httpServiceMock.post.mockReturnValue(throwError(() => error));

      // Act
      const result = await adapter.validateFacialMatch(facialData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(ValidationStatus.FAIL);
      expect(result.error).toBe('Network error');
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error en validación facial:',
        error,
      );
    });

    it('should handle failed validation response', async () => {
      // Arrange
      const mockUrl = 'http://kyc-service.example.com';
      (adapter as any).kycServiceUrl = mockUrl;

      const facialData: FacialValidationDto = {
        documentType: 'CEDULA',
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
      };

      const failedResponse: AxiosResponse<any> = {
        data: {
          success: false,
          status: ValidationStatus.FAIL,
          error: 'Face match score too low',
          score: 0.35,
          timestamp: '2023-01-01T12:00:00Z',
          details: {
            faceMatchScore: 0.35,
            threshold: 0.7,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.post.mockReturnValue(of(failedResponse));

      // Act
      const result = await adapter.validateFacialMatch(facialData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(ValidationStatus.FAIL);
      expect(result.error).toBe('Face match score too low');
    });
  });

  describe('buildValidationResult', () => {
    it('should handle already formatted validation result', async () => {
      // Arrange
      const formattedData: ValidationResult = {
        success: true,
        status: ValidationStatus.OK,
        score: 0.95,
        timestamp: '2023-01-01T12:00:00Z',
        details: { someProperty: 'someValue' },
      };

      const mockUrl = 'http://kyc-service.example.com';
      (adapter as any).kycServiceUrl = mockUrl;

      const mockResponse: AxiosResponse<any> = {
        data: formattedData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.post.mockReturnValue(of(mockResponse));

      // Act
      const result = await adapter.validateLiveness({
        selfieImage: 'test',
        livenessData: 'test',
      });

      // Assert
      expect(result).toEqual(formattedData);
    });

    it('should transform unformatted data to standard format', async () => {
      // Arrange
      const unformattedData = {
        someProperty: 'someValue',
        anotherProperty: 123,
      };

      // Mock para que podamos probar el método privado
      const mockUrl = 'http://kyc-service.example.com';
      (adapter as any).kycServiceUrl = mockUrl;

      const mockResponse: AxiosResponse<any> = {
        data: unformattedData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.post.mockReturnValue(of(mockResponse));

      // Act
      const result = await adapter.validateLiveness({
        selfieImage: 'test',
        livenessData: 'test',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe(ValidationStatus.OK);
      expect(result.timestamp).toBeDefined();
      expect(result.details).toEqual(unformattedData);
    });
  });
});
