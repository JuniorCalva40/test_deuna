import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RestMsaNbCnbOrqService } from './rest-msa-nb-cnb-orq.service';
import { of, throwError } from 'rxjs';
import {
  DocumentValidationInputDto, // OtpValidationInputDto was likely this
  NotifyOnboardingFinishInputDto,
  IElectronicSignatureDataRequest,
  BiometricValidationInputDto, // Changed from CombinedBiometricValidationInputDto
  GenerateDocumentDto,
  QueryDocumentInputDto,
} from '../dto/msa-nb-cnb-orq-input.dto';
import {
  BiometricValidationResponseDto, // Changed from BiometricValidationOrqResponseDto
  DocumentValidationResponseDto, // OtpValidationResponseDto was likely this
  ISaveElectronicSignatureResponseRedis,
  GenerateDocumentResponseDto,
  QueryDocumentResponseDto,
} from '../dto/msa-nb-cnb-orq-response.dto';
import { TrackingBaseDto } from '../../../common/constants/common';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { AxiosError } from 'axios';
import { AxiosResponse } from 'axios';

// Placeholder for the correct DTO, this will need to be updated
let mockInput: BiometricValidationInputDto; // Changed type

describe('RestMsaNbCnbOrqService', () => {
  let service: RestMsaNbCnbOrqService;
  let httpService: HttpService;
  let kafkaService: KafkaService;

  const mockHttpService = {
    post: jest.fn(),
    patch: jest.fn(),
    get: jest.fn(),
  };

  const mockKafkaService = {
    publishToQueue: jest.fn(),
  };

  const mockTracking: TrackingBaseDto = {
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
    sessionId: 'test-session-id',
  };

  const mockOnboardingFinishInput: NotifyOnboardingFinishInputDto = {
    commercialName: 'Test Commercial Name',
    establishmentType: 'Test Establishment Type',
    fullAddress: 'Test Full Address',
    status: 'Test Status',
    establishmentNumber: 'Test Establishment Number',
    headquarters: true,
    nodeId: 'test-node-id',
    typeClient: 'Test Type Client',
    latitude: 'Test Latitude',
    longitude: 'Test Longitude',
    referenceTransaction: 'Test Reference Transaction',
  };

  mockInput = {
    facialAndLivenessValidation: {
      // Changed structure
      token1: 'test-token1',
      token2: 'test-token2',
      method: 1,
    },
    onboardingSessionId: 'test-onboarding-id',
  };

  const mockResponse: BiometricValidationResponseDto = {
    scanId: 'test-scan-id',
  };

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const configServiceMock = {
      get: jest.fn((key) => {
        if (key === 'MSA_NB_CNB_ORQ_URL') {
          return 'http://test-url';
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbCnbOrqService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    service = module.get<RestMsaNbCnbOrqService>(RestMsaNbCnbOrqService);
    httpService = module.get<HttpService>(HttpService);
    kafkaService = module.get<KafkaService>(KafkaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('notifyOnboardingFinish', () => {
    it('should successfully publish onboarding finish notification', (done) => {
      // Arrange
      mockKafkaService.publishToQueue.mockResolvedValue(undefined);

      // Act
      service
        .notifyOnboardingFinish(mockOnboardingFinishInput, mockTracking)
        .subscribe({
          next: () => {
            // Assert
            expect(mockKafkaService.publishToQueue).toHaveBeenCalledWith({
              topic: 'cnb.cnb.complete',
              headers: {
                source: 'leap-x/nb-gql',
                timestamp: expect.any(String),
                trackingId: mockTracking.trackingId,
              },
              value: mockOnboardingFinishInput,
            });
            done();
          },
        });
    });

    it('should handle Kafka publish error', (done) => {
      // Arrange
      const kafkaError = new Error('Kafka publish failed');
      mockKafkaService.publishToQueue.mockRejectedValue(kafkaError);

      // Act
      service
        .notifyOnboardingFinish(mockOnboardingFinishInput, mockTracking)
        .subscribe({
          error: (error) => {
            // Assert
            expect(error).toBe(kafkaError);
            done();
          },
        });
    });
  });

  describe('startBiometricValidation', () => {
    it('should return an Observable of BiometricValidationResponseDto on successful validation', () => {
      const currentMockInput: BiometricValidationInputDto = {
        // Changed type
        facialAndLivenessValidation: {
          // Changed structure
          token1: 'token1',
          token2: 'token2',
          method: 1,
        },
        onboardingSessionId: 'sessionId',
      };
      const currentMockTracking: TrackingBaseDto = {
        sessionId: 'session-id',
        trackingId: 'tracking-id',
        requestId: 'request-id',
      };
      const currentMockResponse: BiometricValidationResponseDto = {
        scanId: 'scan-id-123',
      };

      // This is the structure that will be sent by the service after internal transformation
      const expectedHttpPayload = {
        facialValidation: {
          token1: currentMockInput.facialAndLivenessValidation.token1,
          token2: currentMockInput.facialAndLivenessValidation.token2,
          method: currentMockInput.facialAndLivenessValidation.method,
        },
        livenessValidation: {
          imageBuffer: currentMockInput.facialAndLivenessValidation.token1,
        },
        onboardingSessionId: currentMockInput.onboardingSessionId,
      };

      jest.spyOn(httpService, 'post').mockReturnValueOnce(
        of({
          data: currentMockResponse,
        } as AxiosResponse<BiometricValidationResponseDto>),
      );

      service
        .startBiometricValidation(currentMockInput, currentMockTracking)
        .subscribe({
          next: (response) => {
            expect(response).toEqual(currentMockResponse);
            expect(mockHttpService.post).toHaveBeenCalledWith(
              'http://test-url/api/v1/cnb/kyc',
              expectedHttpPayload, // Use the transformed payload for expectation
              {
                headers: {
                  'x-tracking-id': currentMockTracking.trackingId,
                  'x-request-id': currentMockTracking.requestId,
                  'x-session-id': currentMockTracking.sessionId,
                  trackingid: currentMockTracking.trackingId,
                  requestid: currentMockTracking.requestId,
                  sessionid: currentMockTracking.sessionId,
                },
              },
            );
          },
        });
    });

    it('should handle errors from HttpService correctly for startBiometricValidation', () => {
      const mockInputLocal: BiometricValidationInputDto = {
        // Changed type and structure
        facialAndLivenessValidation: {
          token1: 'token1',
          token2: 'token2',
          method: 1,
        },
        onboardingSessionId: 'sessionId',
      };
      const mockTracking: TrackingBaseDto = {
        sessionId: 'session-id',
        trackingId: 'tracking-id',
        requestId: 'request-id',
      };
      const mockError = new Error('Network error');
      jest
        .spyOn(httpService, 'post')
        .mockReturnValueOnce(throwError(() => mockError));

      // This is the structure that will be sent by the service after internal transformation
      const expectedHttpPayloadErrorCase = {
        facialValidation: {
          token1: mockInputLocal.facialAndLivenessValidation.token1,
          token2: mockInputLocal.facialAndLivenessValidation.token2,
          method: mockInputLocal.facialAndLivenessValidation.method,
        },
        livenessValidation: {
          imageBuffer: mockInputLocal.facialAndLivenessValidation.token1,
        },
        onboardingSessionId: mockInputLocal.onboardingSessionId,
      };

      service.startBiometricValidation(mockInputLocal, mockTracking).subscribe({
        error: (error) => {
          expect(error.message).toContain('Network error');
          expect(mockHttpService.post).toHaveBeenCalledWith(
            'http://test-url/api/v1/cnb/kyc',
            expectedHttpPayloadErrorCase, // Use the transformed payload for expectation
            {
              headers: {
                'x-tracking-id': mockTracking.trackingId,
                'x-request-id': mockTracking.requestId,
                'x-session-id': mockTracking.sessionId,
                trackingid: mockTracking.trackingId,
                requestid: mockTracking.requestId,
                sessionid: mockTracking.sessionId,
              },
            },
          );
        },
      });
    });

    it('should handle AxiosError with response data for startBiometricValidation', () => {
      const mockInputLocal: BiometricValidationInputDto = {
        // Changed type and structure
        facialAndLivenessValidation: {
          token1: 'token1',
          token2: 'token2',
          method: 1,
        },
        onboardingSessionId: 'sessionId',
      };
      const mockTracking: TrackingBaseDto = {
        sessionId: 'session-id',
        trackingId: 'tracking-id',
        requestId: 'request-id',
      };
      const mockAxiosError = new AxiosError(
        'Internal Server Error',
        '500',
        undefined,
        undefined,
        { data: { detail: 'axios error detail' } } as any,
      );
      jest
        .spyOn(httpService, 'post')
        .mockReturnValueOnce(throwError(() => mockAxiosError));

      // This is the structure that will be sent by the service after internal transformation
      const expectedHttpPayloadAxiosErrorCase = {
        facialValidation: {
          token1: mockInputLocal.facialAndLivenessValidation.token1,
          token2: mockInputLocal.facialAndLivenessValidation.token2,
          method: mockInputLocal.facialAndLivenessValidation.method,
        },
        livenessValidation: {
          imageBuffer: mockInputLocal.facialAndLivenessValidation.token1,
        },
        onboardingSessionId: mockInputLocal.onboardingSessionId,
      };

      service.startBiometricValidation(mockInputLocal, mockTracking).subscribe({
        error: (error) => {
          expect(error.code).toBe(ErrorCodes.MORPHOLOGY_SERVICE_ERROR);
          expect(error.message).toContain('Failed to validate morphology');
          expect(error.details).toEqual({ detail: 'axios error detail' });
          expect(mockHttpService.post).toHaveBeenCalledWith(
            'http://test-url/api/v1/cnb/kyc',
            expectedHttpPayloadAxiosErrorCase, // Use the transformed payload for expectation
            {
              headers: {
                'x-tracking-id': mockTracking.trackingId,
                'x-request-id': mockTracking.requestId,
                'x-session-id': mockTracking.sessionId,
                trackingid: mockTracking.trackingId,
                requestid: mockTracking.requestId,
                sessionid: mockTracking.sessionId,
              },
            },
          );
        },
      });
    });

    it('should handle AxiosError without response data for startBiometricValidation', () => {
      const mockInputLocal: BiometricValidationInputDto = {
        // Changed type and structure
        facialAndLivenessValidation: {
          token1: 'token1',
          token2: 'token2',
          method: 1,
        },
        onboardingSessionId: 'sessionId',
      };
      const mockTracking: TrackingBaseDto = {
        sessionId: 'session-id',
        trackingId: 'tracking-id',
        requestId: 'request-id',
      };
      const mockAxiosError = new AxiosError('Network error');
      jest
        .spyOn(httpService, 'post')
        .mockReturnValueOnce(throwError(() => mockAxiosError));

      // This is the structure that will be sent by the service after internal transformation
      const expectedHttpPayloadAxiosErrorNoDataCase = {
        facialValidation: {
          token1: mockInputLocal.facialAndLivenessValidation.token1,
          token2: mockInputLocal.facialAndLivenessValidation.token2,
          method: mockInputLocal.facialAndLivenessValidation.method,
        },
        livenessValidation: {
          imageBuffer: mockInputLocal.facialAndLivenessValidation.token1,
        },
        onboardingSessionId: mockInputLocal.onboardingSessionId,
      };

      service.startBiometricValidation(mockInputLocal, mockTracking).subscribe({
        error: (error) => {
          expect(error.code).toBe(ErrorCodes.MORPHOLOGY_SERVICE_ERROR);
          expect(error.message).toContain('Failed to validate morphology');
          expect(error.details).toBeUndefined();
          expect(mockHttpService.post).toHaveBeenCalledWith(
            'http://test-url/api/v1/cnb/kyc',
            expectedHttpPayloadAxiosErrorNoDataCase, // Use the transformed payload for expectation
            {
              headers: {
                'x-tracking-id': mockTracking.trackingId,
                'x-request-id': mockTracking.requestId,
                'x-session-id': mockTracking.sessionId,
                trackingid: mockTracking.trackingId,
                requestid: mockTracking.requestId,
                sessionid: mockTracking.sessionId,
              },
            },
          );
        },
      });
    });

    it('should successfully validate and return scanId', (done) => {
      // Arrange
      mockHttpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      // This is the structure that will be sent by the service after internal transformation
      // Using the global mockInput for this case
      const expectedHttpPayloadGlobal = {
        facialValidation: {
          token1: mockInput.facialAndLivenessValidation.token1,
          token2: mockInput.facialAndLivenessValidation.token2,
          method: mockInput.facialAndLivenessValidation.method,
        },
        livenessValidation: {
          imageBuffer: mockInput.facialAndLivenessValidation.token1,
        },
        onboardingSessionId: mockInput.onboardingSessionId,
      };

      // Act
      service.startBiometricValidation(mockInput, mockTracking).subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockResponse);
          expect(mockHttpService.post).toHaveBeenCalledWith(
            'http://test-url/api/v1/cnb/kyc',
            expectedHttpPayloadGlobal, // Use the transformed payload for expectation
            {
              headers: {
                'x-tracking-id': mockTracking.trackingId,
                'x-request-id': mockTracking.requestId,
                'x-session-id': mockTracking.sessionId,
                trackingid: mockTracking.trackingId,
                requestid: mockTracking.requestId,
                sessionid: mockTracking.sessionId,
              },
            },
          );
          done();
        },
      });
    });

    it('should handle 400 Bad Request error', (done) => {
      // Arrange
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid document data' },
        },
        message: 'Bad Request',
      };

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.startBiometricValidation(mockInput, mockTracking).subscribe({
        error: (error) => {
          expect(error.code).toBe('NB_ERR_1505');
          expect(error.message).toContain('Failed to validate morphology');
          expect(error.details).toEqual(errorResponse.response.data);
          done();
        },
      });
    });

    it('should handle 408 Request Timeout error', (done) => {
      // Arrange
      const errorResponse = {
        response: {
          status: 408,
          data: { message: 'Request timeout' },
        },
        message: 'Request Timeout',
      };

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.startBiometricValidation(mockInput, mockTracking).subscribe({
        error: (error) => {
          expect(error.code).toBe('NB_ERR_1506');
          expect(error.message).toContain('Failed to validate morphology');
          expect(error.details).toEqual(errorResponse.response.data);
          done();
        },
      });
    });

    it('should handle generic service error', (done) => {
      // Arrange
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
        message: 'Internal Server Error',
      };

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.startBiometricValidation(mockInput, mockTracking).subscribe({
        error: (error) => {
          expect(error.code).toBe('NB_ERR_1502');
          expect(error.message).toContain('Failed to validate morphology');
          expect(error.details).toEqual(errorResponse.response.data);
          done();
        },
      });
    });
  });

  describe('documentValidation', () => {
    const mockDocumentInput: DocumentValidationInputDto = {
      merchantIdScanReference: 'test-scan-ref',
      frontsideImage: 'test-front-image',
      backsideImage: 'test-back-image',
      country: 'PE',
      idType: 'DNI',
      onboardingSessionId: 'test-onboarding-session-id',
    };

    const mockDocumentResponse: DocumentValidationResponseDto = {
      statusValidation: 'VALID',
    };

    it('should successfully validate document and return status', (done) => {
      // Arrange
      mockHttpService.post.mockReturnValue(
        of({
          data: mockDocumentResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      // Act
      service.documentValidation(mockDocumentInput, mockTracking).subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockDocumentResponse);
          expect(mockHttpService.post).toHaveBeenCalledWith(
            'http://test-url/api/v1/kyc-document-validation',
            mockDocumentInput,
            {
              headers: {
                'x-tracking-id': mockTracking.trackingId,
                'x-request-id': mockTracking.requestId,
                'x-session-id': mockTracking.sessionId,
                trackingid: mockTracking.trackingId,
                requestid: mockTracking.requestId,
                sessionid: mockTracking.sessionId,
              },
            },
          );
          done();
        },
      });
    });

    it('should handle 400 Bad Request error', (done) => {
      // Arrange
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid document data' },
        },
        message: 'Bad Request',
      };

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.documentValidation(mockDocumentInput, mockTracking).subscribe({
        error: (error) => {
          expect(error.code).toBe(ErrorCodes.DOCUMENT_VALIDATION_DATA_INVALID);
          expect(error.message).toContain('Failed to validate document');
          expect(error.details).toEqual(errorResponse.response.data);
          done();
        },
      });
    });

    it('should handle 408 Request Timeout error', (done) => {
      // Arrange
      const errorResponse = {
        response: {
          status: 408,
          data: { message: 'Request timeout' },
        },
        message: 'Request Timeout',
      };

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.documentValidation(mockDocumentInput, mockTracking).subscribe({
        error: (error) => {
          expect(error.code).toBe(
            ErrorCodes.DOCUMENT_VALIDATION_REQUEST_TIMEOUT,
          );
          expect(error.message).toContain('Failed to validate document');
          expect(error.details).toEqual(errorResponse.response.data);
          done();
        },
      });
    });

    it('should handle generic service error', (done) => {
      // Arrange
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
        message: 'Internal Server Error',
      };

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act
      service.documentValidation(mockDocumentInput, mockTracking).subscribe({
        error: (error) => {
          expect(error.code).toBe(ErrorCodes.DOCUMENT_VALIDATION_SERVICE_ERROR);
          expect(error.message).toContain('Failed to validate document');
          expect(error.details).toEqual(errorResponse.response.data);
          done();
        },
      });
    });
  });

  describe('startElectronicSignatureProcess', () => {
    const mockClientCnbDocumentId = 'test-document-id';
    const mockElectronicSignatureResponse = {
      status: 'SUCCESS',
      processId: 'process-123',
      message: 'Electronic signature process initiated successfully',
    };

    it('should successfully initiate electronic signature process', (done) => {
      // Arrange
      mockHttpService.post.mockReturnValue(
        of({
          data: mockElectronicSignatureResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      // Act
      service
        .startElectronicSignatureProcess(mockClientCnbDocumentId, mockTracking)
        .subscribe({
          next: (result) => {
            // Assert
            expect(result).toEqual(mockElectronicSignatureResponse);
            expect(mockHttpService.post).toHaveBeenCalledWith(
              `http://test-url/api/v1/electronic-signature/${mockClientCnbDocumentId}/process`,
              {},
              {
                headers: {
                  'x-tracking-id': mockTracking.trackingId,
                  'x-request-id': mockTracking.requestId,
                  'x-session-id': mockTracking.sessionId,
                  trackingid: mockTracking.trackingId,
                  requestid: mockTracking.requestId,
                  sessionid: mockTracking.sessionId,
                },
              },
            );
            done();
          },
        });
    });

    it('should handle error in electronic signature process', (done) => {
      // Arrange
      const errorResponse = new Error('Service unavailable');
      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act
      service
        .startElectronicSignatureProcess(mockClientCnbDocumentId, mockTracking)
        .subscribe({
          error: (error) => {
            // Assert
            expect(error).toBe(errorResponse);
            expect(mockHttpService.post).toHaveBeenCalledWith(
              `http://test-url/api/v1/electronic-signature/${mockClientCnbDocumentId}/process`,
              {},
              {
                headers: {
                  'x-tracking-id': mockTracking.trackingId,
                  'x-request-id': mockTracking.requestId,
                  'x-session-id': mockTracking.sessionId,
                  trackingid: mockTracking.trackingId,
                  requestid: mockTracking.requestId,
                  sessionid: mockTracking.sessionId,
                },
              },
            );
            done();
          },
        });
    });

    it('should handle HTTP 400 Bad Request error', (done) => {
      // Arrange
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid document ID' },
        },
        message: 'Bad Request',
      };
      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act
      service
        .startElectronicSignatureProcess(mockClientCnbDocumentId, mockTracking)
        .subscribe({
          error: (error) => {
            // Assert
            expect(error).toEqual(errorResponse);
            done();
          },
        });
    });

    it('should handle HTTP 500 Internal Server Error', (done) => {
      // Arrange
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
        message: 'Internal Server Error',
      };
      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act
      service
        .startElectronicSignatureProcess(mockClientCnbDocumentId, mockTracking)
        .subscribe({
          error: (error) => {
            // Assert
            expect(error).toEqual(errorResponse);
            done();
          },
        });
    });

    it('should handle network errors', (done) => {
      // Arrange
      const networkError = new Error('Network Error');
      mockHttpService.post.mockReturnValue(throwError(() => networkError));

      // Act
      service
        .startElectronicSignatureProcess(mockClientCnbDocumentId, mockTracking)
        .subscribe({
          error: (error) => {
            // Assert
            expect(error).toBe(networkError);
            done();
          },
        });
    });
  });

  it('should throw error when MSA_NB_CNB_ORQ_URL is not defined', () => {
    // No need to mock here, we'll create a new instance with a different mock
    const configServiceWithoutUrl = {
      get: jest.fn().mockReturnValue(undefined),
    };

    // Act & Assert
    expect(
      () =>
        new RestMsaNbCnbOrqService(
          httpService,
          configServiceWithoutUrl as unknown as ConfigService,
          kafkaService,
        ),
    ).toThrow('MSA_NB_CNB_ORQ_URL is not defined');
  });

  describe('createElectronicSign', () => {
    const mockElectronicSignCreateRequest: IElectronicSignatureDataRequest = {
      identificationNumber: '45678912',
      applicantName: 'Maria',
      applicantLastName: 'Rodriguez Garcia',
      fingerCode: 'FP12345XYZ',
      emailAddress: 'maria.rodriguez@empresa.com.pe',
      cellphoneNumber: '+51987654321',
      city: 'Lima',
      province: 'Lima',
      address: 'Av. Javier Prado Este 2465, San Borja',
      fileIdentificationFront:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAg...',
      fileIdentificationBack:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAg...',
      fileIdentificationSelfie:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICA...',
    };

    const mockElectronicSignResponse: ISaveElectronicSignatureResponseRedis = {
      status: 'SUCCESS',
      message: 'Electronic signature created successfully',
    };

    it('should successfully create a billing signature and return the response', async () => {
      // Arrange
      mockHttpService.post.mockReturnValue(
        of({
          data: mockElectronicSignResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      // Act
      const result = await service.createElectronicSign(
        mockElectronicSignCreateRequest,
        mockTracking,
      );

      // Assert
      expect(result).toEqual(mockElectronicSignResponse);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://test-url/api/v1/electronic-signature',
        mockElectronicSignCreateRequest,
        {
          headers: {
            sessionId: mockTracking.sessionId,
            trackingId: mockTracking.trackingId,
            requestId: mockTracking.requestId,
          },
        },
      );
    });

    it('should handle errors when creating a billing signature', async () => {
      // Arrange
      const errorResponse = new AxiosError('Internal Server Error', '500');

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      // Act & Assert
      await expect(
        service.createElectronicSign(
          mockElectronicSignCreateRequest,
          mockTracking,
        ),
      ).rejects.toThrow('Internal Server Error');
    });
  });

  describe('updateElectronicSign', () => {
    const mockElectronicSignUpdateRequest: IElectronicSignatureDataRequest = {
      identificationNumber: '45678912',
      fileIdentificationFront:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDA...',
      fileIdentificationBack:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwY...',
      fileIdentificationSelfie:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAw...',
    };

    const mockElectronicSignResponse: ISaveElectronicSignatureResponseRedis = {
      status: 'SUCCESS',
      message: 'Electronic signature created successfully',
    };

    it('should successfully update a billing signature and return the response', async () => {
      mockHttpService.patch.mockReturnValue(
        of({
          data: mockElectronicSignResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.updateElectronicSign(
        mockElectronicSignUpdateRequest,
        mockTracking,
      );

      expect(result).toEqual(mockElectronicSignResponse);
      expect(mockHttpService.patch).toHaveBeenCalledWith(
        'http://test-url/api/v1/electronic-signature/45678912',
        mockElectronicSignUpdateRequest,
        {
          headers: {
            sessionId: mockTracking.sessionId,
            trackingId: mockTracking.trackingId,
            requestId: mockTracking.requestId,
          },
        },
      );
    });

    it('should handle errors when updating a billing signature', async () => {
      const error = new AxiosError('Internal Server Error', '500');
      mockHttpService.patch.mockReturnValue(throwError(() => error));

      await expect(
        service.updateElectronicSign(
          mockElectronicSignUpdateRequest,
          mockTracking,
        ),
      ).rejects.toThrow('Internal Server Error');
    });
  });

  describe('saveCnbState', () => {
    const mockSaveCnbStateInput = {
      identification: '12345',
      cnbState: 'INACTIVE',
      preApprovedState: 'INACTIVE',
      merchantName: 'Test Merchant',
      remainingAttemptsOnb: 0,
      address: [
        {
          fullAddress: 'Test Address 123',
          numberEstablishment: '12345',
          state: 'ABIERTO',
          headquarters: 'test',
          establishmentType: 'ONLINE',
          commercialName: 'Test Commercial Name',
        } as any,
      ],
      status: 'found',
    };

    it('should successfully save the CNB state', (done) => {
      mockHttpService.post.mockReturnValue(
        of({
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      service
        .saveCnbState(mockSaveCnbStateInput, {
          sessionId: 'test-session',
          trackingId: 'test-tracking',
          requestId: 'test-request',
        })
        .subscribe({
          next: (response) => {
            expect(response).toEqual({});
            done();
          },
        });

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://test-url/api/v1/cnb/cnb-state-validation/save',
        mockSaveCnbStateInput,
        {
          headers: {
            requestid: 'test-request',
            sessionid: 'test-session',
            trackingid: 'test-tracking',
          },
        },
      );
    });

    it('should handle errors when saving the CNB state', (done) => {
      const error = new AxiosError('Internal Server Error', '500');
      mockHttpService.post.mockReturnValue(throwError(() => error));

      service.saveCnbState(mockSaveCnbStateInput, mockTracking).subscribe({
        error: (err) => {
          expect(err.message).toEqual('Internal Server Error');
          done();
        },
        complete: done,
        next: done,
      });
    });
  });
  describe('getCnbState', () => {
    const mockGetCnbStateInput = {
      identification: '12345',
    };

    const mockResponse = {
      identification: '12345',
      cnbState: 'INACTIVE',
      preApprovedState: 'INACTIVE',
      merchantName: 'Test Merchant',
      remainingAttemptsOnb: 0,
      address: [
        {
          fullAddress: 'Test Address 123',
          numberEstablishment: '12345',
          state: 'ABIERTO',
          headquarters: 'test',
          establishmentType: 'ONLINE',
          commercialName: 'Test Commercial Name',
        } as any,
      ],
      status: 'found',
    };

    it('should successfully get the CNB state', (done) => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {
            requestid: 'test-request',
            sessionid: 'test-session',
            trackingid: 'test-tracking',
          },
          config: {},
        }),
      );

      service
        .getCnbState(mockGetCnbStateInput.identification, mockTracking)
        .subscribe({
          next: (response) => {
            expect(response.status).toEqual('found');
            done();
          },
        });
    });

    it('should handle errors when getting the CNB state', (done) => {
      const error = new AxiosError('Internal Server Error', '500');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      service
        .getCnbState(mockGetCnbStateInput.identification, mockTracking)
        .subscribe({
          error: (err) => {
            expect(err.message).toEqual('Internal Server Error');
            done();
          },
          complete: done,
          next: done,
        });
    });
  });
  describe('generateDocument', () => {
    const mockGenerateDocumentPayload: GenerateDocumentDto = {
      commerceId: 'commerce123',
      htmlTemplate: '<html><body>Hello</body></html>',
      description: 'Test HTML document',
      identification: 'ID123456',
      fileName: 'document.pdf',
      processName: 'contract-process',
      mimeType: 'application/pdf',
      extension: 'pdf',
      tags: ['contract'],
    };

    const mockGenerateDocumentResponse: GenerateDocumentResponseDto = {
      status: 'SUCCESS',
      message: 'Document generated successfully',
      data: [
        {
          signedUrl: 'https://s3.mock.com/file.pdf',
          fileName: 'document.pdf',
          processName: 'contract-process',
          tags: ['contract'],
        },
      ],
    };

    it('should generate document successfully', (done) => {
      mockHttpService.post.mockReturnValue(of({ data: mockGenerateDocumentResponse }));
      service.generateDocument(mockGenerateDocumentPayload).subscribe((response) => {
        expect(response).toEqual(mockGenerateDocumentResponse);
        done();
      });
    });

    it('should handle 400 error', (done) => {
      mockHttpService.post.mockReturnValue(throwError(() => ({
        message: 'Bad Request',
        response: { status: 400, data: { error: 'Invalid input' } },
      })));

      service.generateDocument(mockGenerateDocumentPayload).subscribe({
        error: (err) => {
          expect(err.message).toContain('generate document');
          done();
        },
      });
    });

    it('should handle 408 timeout', (done) => {
      mockHttpService.post.mockReturnValue(throwError(() => ({
        message: 'Timeout',
        response: { status: 408, data: { error: 'Request Timeout' } },
      })));

      service.generateDocument(mockGenerateDocumentPayload).subscribe({
        error: (err) => {
          expect(err.message).toContain('generate document');
          done();
        },
      });
    });

    it('should handle generic 500 error', (done) => {
      mockHttpService.post.mockReturnValue(throwError(() => ({
        message: 'Internal Server Error',
        response: { status: 500, data: { error: 'Server failure' } },
      })));

      service.generateDocument(mockGenerateDocumentPayload).subscribe({
        error: (err) => {
          expect(err.message).toContain('generate document');
          done();
        },
      });
    });
  });

  describe('queryDocument', () => {
    const mockQueryPayload: QueryDocumentInputDto = {
      templateName: 'contract-template',
      templatePath: 'documents/templates/contract.html',
    };

    const mockQueryResponse: QueryDocumentResponseDto = {
      status: 'SUCCESS',
      message: 'Query executed successfully',
      data: {
        presignedUrl: 'https://s3.mock.com/query-result.pdf',
        b64encoded: 'SGVsbG8gd29ybGQ=',
      },
    };

    it('should query document successfully', (done) => {
      mockHttpService.post.mockReturnValue(of({ data: mockQueryResponse }));
      service.queryDocument(mockQueryPayload).subscribe((response) => {
        expect(response).toEqual(mockQueryResponse);
        done();
      });
    });

    it('should handle 400 error', (done) => {
      mockHttpService.post.mockReturnValue(throwError(() => ({
        message: 'Bad Request',
        response: { status: 400, data: { error: 'Invalid input' } },
      })));

      service.queryDocument(mockQueryPayload).subscribe({
        error: (err) => {
          expect(err.message).toContain('query document');
          done();
        },
      });
    });

    it('should handle 408 timeout', (done) => {
      mockHttpService.post.mockReturnValue(throwError(() => ({
        message: 'Timeout',
        response: { status: 408, data: { error: 'Request Timeout' } },
      })));

      service.queryDocument(mockQueryPayload).subscribe({
        error: (err) => {
          expect(err.message).toContain('query document');
          done();
        },
      });
    });

    it('should handle generic 500 error', (done) => {
      mockHttpService.post.mockReturnValue(throwError(() => ({
        message: 'Internal Server Error',
        response: { status: 500, data: { error: 'Server failure' } },
      })));

      service.queryDocument(mockQueryPayload).subscribe({
        error: (err) => {
          expect(err.message).toContain('query document');
          done();
        },
      });
    });
  });
});
