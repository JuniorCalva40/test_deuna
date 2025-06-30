import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@deuna/tl-logger-nd';
import { DocumentValidationAdapter } from './document-validation.adapter';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { DocumentValidationStartDto } from '../../../application/dto/document-validation-start.dto';
import { DocumentValidationType } from '../../../domain/enums/document-validation-type.enum';
import {
  DocumentValidationStartResponse,
  DocumentValidationStatusResponse,
  DocumentValidationDataResponse,
} from '../../../application/dto/document-validation-response.dto';
import {
  DocumentValidationStatus,
  DocumentValidationResultStatus,
} from '../../../domain/enums/document-validation.enum';

jest.mock('@deuna/tl-logger-nd');

describe('DocumentValidationAdapter', () => {
  let adapter: DocumentValidationAdapter;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let loggerMock: jest.Mocked<Logger>;

  const mockApiUrl = 'http://mock-kyc-api.com';
  const mockTrackingData = {
    trackingId: 'test-tracking-id',
    sessionId: 'test-session-id',
    requestId: 'test-request-id',
  };

  const mockScanReference = 'test-scan-reference';

  beforeEach(async () => {
    httpService = {
      post: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'MSA_TL_KYC_URL') return mockApiUrl;
        return null;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    loggerMock = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(
      () => loggerMock,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentValidationAdapter,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    adapter = module.get<DocumentValidationAdapter>(DocumentValidationAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('startValidation', () => {
    const mockInput: Omit<DocumentValidationStartDto, 'onboardingSessionId'> = {
      trackingId: mockTrackingData.trackingId,
      sessionId: mockTrackingData.sessionId,
      requestId: mockTrackingData.requestId,
      merchantIdScanReference: 'mock-merchant-scan-reference',
      frontsideImage: 'base64-frontside-image',
      backsideImage: 'base64-backside-image',
      country: 'ECU',
      idType: DocumentValidationType.DNI,
    };

    const mockResponse: DocumentValidationStartResponse = {
      timestamp: '2023-08-01T10:00:00Z',
      scanReference: mockScanReference,
      type: 'ID_CARD',
    };

    it('should successfully start validation', async () => {
      // Arrange
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      httpService.post.mockReturnValueOnce(of(axiosResponse));

      // Act
      const result = await adapter.startValidation(mockInput);

      // Assert
      expect(httpService.post).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/kyc/document-validation`,
        expect.objectContaining({
          frontsideImage: mockInput.frontsideImage,
          backsideImage: mockInput.backsideImage,
          country: mockInput.country,
          idType: mockInput.idType,
        }),
        {
          headers: {
            trackingId: mockInput.trackingId,
            sessionId: mockInput.sessionId,
            requestId: mockInput.requestId,
          },
        },
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error if input is missing', async () => {
      // Act & Assert
      await expect(adapter.startValidation(null)).rejects.toThrow(
        'Input data is required',
      );
    });

    it('should throw error if required fields are missing', async () => {
      // Arrange
      const invalidInput = {
        sessionId: 'test-session',
        requestId: 'test-request',
        // missing trackingId and other required fields
      };

      // Act & Assert
      await expect(
        adapter.startValidation(invalidInput as any),
      ).rejects.toThrow('Required fields are missing');
    });

    it('should throw error if API URL is not configured', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue(null);
      adapter = new DocumentValidationAdapter(httpService, configService);

      // Act & Assert
      await expect(adapter.startValidation(mockInput)).rejects.toThrow(
        'API URL rest-msa-tl-kyc is not configured',
      );
    });

    it('should handle API errors', async () => {
      // Arrange
      const mockError = new Error('Request failed with status code 500');
      mockError['response'] = {
        status: 500,
        data: { message: 'Server error' },
      };

      httpService.post.mockImplementationOnce(() => {
        return {
          pipe: jest.fn().mockImplementation(() => {
            throw mockError;
          }),
        } as any;
      });

      // Act & Assert
      await expect(adapter.startValidation(mockInput)).rejects.toThrow();
    });
  });

  describe('getValidationStatus', () => {
    const mockStatusResponse: DocumentValidationStatusResponse = {
      status: DocumentValidationStatus.DONE,
      timestamp: '2023-08-01T10:15:00Z',
      scanReference: mockScanReference,
    };

    it('should successfully get validation status', async () => {
      // Arrange
      const axiosResponse: AxiosResponse = {
        data: mockStatusResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      httpService.get.mockReturnValueOnce(of(axiosResponse));

      // Act
      const result = await adapter.getValidationStatus(
        mockScanReference,
        mockTrackingData,
      );

      // Assert
      expect(httpService.get).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/kyc/document-validation/status-check/${mockScanReference}`,
        {
          headers: {
            trackingId: mockTrackingData.trackingId,
            sessionId: mockTrackingData.sessionId,
            requestId: mockTrackingData.requestId,
          },
        },
      );

      expect(result).toEqual(mockStatusResponse);
    });

    it('should throw error if API URL is not configured', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue(null);
      adapter = new DocumentValidationAdapter(httpService, configService);

      // Act & Assert
      await expect(
        adapter.getValidationStatus(mockScanReference, mockTrackingData),
      ).rejects.toThrow('API URL rest-msa-tl-kyc is not configured');
    });

    it('should handle API errors', async () => {
      // Arrange
      const mockError = new Error('Request failed with status code 404');
      mockError['response'] = {
        status: 404,
        data: { message: 'Scan reference not found' },
      };

      httpService.get.mockImplementationOnce(() => {
        return {
          pipe: jest.fn().mockImplementation(() => {
            throw mockError;
          }),
        } as any;
      });

      // Act & Assert
      await expect(
        adapter.getValidationStatus(mockScanReference, mockTrackingData),
      ).rejects.toThrow();
    });
  });

  describe('getValidationData', () => {
    const mockDataResponse: DocumentValidationDataResponse = {
      status: DocumentValidationResultStatus.APPROVED_VERIFIED,
    };

    it('should successfully get validation data', async () => {
      // Arrange
      const axiosResponse: AxiosResponse = {
        data: mockDataResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      httpService.get.mockReturnValueOnce(of(axiosResponse));

      // Act
      const result = await adapter.getValidationData(
        mockScanReference,
        mockTrackingData,
      );

      // Assert
      expect(httpService.get).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/kyc/document-validation/data-check/${mockScanReference}`,
        {
          headers: {
            trackingId: mockTrackingData.trackingId,
            sessionId: mockTrackingData.sessionId,
            requestId: mockTrackingData.requestId,
          },
        },
      );

      expect(result).toEqual(mockDataResponse);
    });

    it('should throw error if API URL is not configured', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue(null);
      adapter = new DocumentValidationAdapter(httpService, configService);

      // Act & Assert
      await expect(
        adapter.getValidationData(mockScanReference, mockTrackingData),
      ).rejects.toThrow('API URL rest-msa-tl-kyc is not configured');
    });

    it('should handle API errors', async () => {
      // Arrange
      const mockError = new Error('Request failed with status code 500');
      mockError['response'] = {
        status: 500,
        data: { message: 'Internal server error' },
      };

      httpService.get.mockImplementationOnce(() => {
        return {
          pipe: jest.fn().mockImplementation(() => {
            throw mockError;
          }),
        } as any;
      });

      // Act & Assert
      await expect(
        adapter.getValidationData(mockScanReference, mockTrackingData),
      ).rejects.toThrow();
    });
  });
});
