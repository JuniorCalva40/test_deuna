import { Test, TestingModule } from '@nestjs/testing';
import { KycDocumentValidationService } from './kyc-document-validation.service';
import { DOCUMENT_VALIDATION_CLIENT_PORT, DETOKENIZE_IMAGE_PORT } from '../../domain/constants/injection.constants';
import { ONBOARDING_CLIENT_PORT } from '../ports/out/clients/onboarding-client.port';
import { PublishDocumentValidationQueueUseCase } from '../use-cases/document-validation/publish-document-validation-queue.use-case';
import { DocumentValidationStartDto } from '../dto/document-validation-start.dto';
import { DocumentValidationType } from '../../domain/enums/document-validation-type.enum';
import { GetDocumentValidationStatusUseCase } from '../use-cases/get-document-validation-status.use-case';
import { GetDocumentValidationDataUseCase } from '../use-cases/get-document-validation-data.use-case';
import { DocumentValidationStatus } from '../../domain/enums/document-validation.enum';
import { ConfigService } from '@nestjs/config';
import { DetokenizeImageUseCase } from '../use-cases/detokenize/detokenize-image.use-case';

jest.mock('@deuna/tl-logger-nd', () => {
  return {
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    })),
  };
});

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('KycDocumentValidationService', () => {
  let service: KycDocumentValidationService;
  let publishDocumentValidationQueueUseCase: PublishDocumentValidationQueueUseCase;

  const mockDocumentValidationClient = {
    startValidation: jest.fn(),
    getValidationStatus: jest.fn(),
    getValidationData: jest.fn(),
  };

  const mockOnboardingClient = {
    updateStatus: jest.fn(),
    updateOnboardingState: jest.fn().mockResolvedValue({ statusCode: 200 }),
  };

  const mockPublishDocumentValidationQueueUseCase = {
    execute: jest.fn(),
  };

  const mockGetDocumentValidationStatusUseCase = {
    execute: jest.fn().mockResolvedValue({
      status: DocumentValidationStatus.DONE,
      timestamp: '2023-08-01T10:15:00Z',
      scanReference: 'test-scan-reference',
    }),
  };

  const mockGetDocumentValidationDataUseCase = {
    execute: jest.fn().mockResolvedValue({
      status: 'APPROVED_VERIFIED',
    }),
  };

  const mockDetokenizeImageUseCase = {
    execute: jest.fn().mockResolvedValue({ imageData: 'detokenized-image-data', status: 'SUCCESS' }),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'RETRY_DELAY_MS_QUEUE_IDENTITY_DOCUMENT_VALIDATION') return 0;
      return null;
    }),
  };

  // Common test data
  const defaultTrackingInfo = {
    sessionId: 'test-session-id',
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
  };

  const defaultMessage = {
    scanReference: 'test-scan-id',
    type: 'cnb-document',
    sessionId: 'test-session-id',
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reinitialize the setTimeout mock for each test
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
      // Execute the function immediately instead of waiting
      fn();
      return 123 as any; // Fake timer ID
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycDocumentValidationService,
        {
          provide: DOCUMENT_VALIDATION_CLIENT_PORT,
          useValue: mockDocumentValidationClient,
        },
        {
          provide: ONBOARDING_CLIENT_PORT,
          useValue: mockOnboardingClient,
        },
        {
          provide: PublishDocumentValidationQueueUseCase,
          useValue: mockPublishDocumentValidationQueueUseCase,
        },
        {
          provide: GetDocumentValidationStatusUseCase,
          useValue: mockGetDocumentValidationStatusUseCase,
        },
        {
          provide: GetDocumentValidationDataUseCase,
          useValue: mockGetDocumentValidationDataUseCase,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DETOKENIZE_IMAGE_PORT,
          useValue: mockDetokenizeImageUseCase,
        },
      ],
    }).compile();

    service = module.get<KycDocumentValidationService>(
      KycDocumentValidationService,
    );
    publishDocumentValidationQueueUseCase =
      module.get<PublishDocumentValidationQueueUseCase>(
        PublishDocumentValidationQueueUseCase,
      );
  });

  afterAll(() => {
    // Restore the mocks
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startValidation', () => {
    const createValidationDto = (): DocumentValidationStartDto => ({
      onboardingSessionId: 'session-123',
      sessionId: 'test-session',
      trackingId: 'test-tracking',
      requestId: 'test-request',
      merchantIdScanReference: 'merchant-123',
      frontsideImage: 'base64-front-image',
      backsideImage: 'base64-back-image',
      country: 'PE',
      idType: DocumentValidationType.DNI,
    });

    it('debe iniciar la validación, actualizar el estado y publicar en la cola', async () => {
      // Arrange
      const dto = createValidationDto();
      const scanReference = 'scan-123';

      mockDocumentValidationClient.startValidation.mockResolvedValue({
        scanReference,
      });

      mockOnboardingClient.updateStatus.mockResolvedValue({
        statusCode: 200,
      });

      // Act
      const result = await service.startValidation(dto);

      // Assert
      expect(mockDocumentValidationClient.startValidation).toHaveBeenCalled();
      expect(mockOnboardingClient.updateOnboardingState).toHaveBeenCalled();
      expect(
        publishDocumentValidationQueueUseCase.execute,
      ).toHaveBeenCalledWith({
        scanReference: scanReference,
        type: 'cnb-document',
        onboardingSessionId: 'session-123',
        sessionId: expect.any(String),
        trackingId: 'test-tracking',
        requestId: expect.any(String),
      });
      expect(result).toEqual({
        statusValidation: 'PENDING',
      });
    });

    it('debe manejar fallos en la validación', async () => {
      // Arrange
      const dto = createValidationDto();

      // Without scanReference indicates a failure
      mockDocumentValidationClient.startValidation.mockResolvedValue({});

      mockOnboardingClient.updateStatus.mockResolvedValue({
        statusCode: 200,
      });

      // Act
      const result = await service.startValidation(dto);

      // Assert
      expect(mockDocumentValidationClient.startValidation).toHaveBeenCalled();
      expect(mockOnboardingClient.updateOnboardingState).toHaveBeenCalled();
      // The service calls publishDocumentValidationQueueUseCase.execute even when the validation fails
      expect(
        publishDocumentValidationQueueUseCase.execute,
      ).toHaveBeenCalledWith({
        scanReference: undefined,
        type: 'cnb-document',
        onboardingSessionId: 'session-123',
        sessionId: expect.any(String),
        trackingId: 'test-tracking',
        requestId: expect.any(String),
      });
      expect(result).toEqual({
        statusValidation: 'FAILED',
      });
    });
  });

  describe('processDocumentValidationMessage', () => {
    it('debe procesar el mensaje de validación de documento desde la cola', async () => {
      // Arrange
      const message = { ...defaultMessage };
      const trackingInfo = { ...defaultTrackingInfo };

      // Act
      await service.processDocumentValidationMessage(message, trackingInfo);

      // Assert
      expect(
        mockGetDocumentValidationStatusUseCase.execute,
      ).toHaveBeenCalledWith(message.scanReference, trackingInfo);
      expect(mockGetDocumentValidationDataUseCase.execute).toHaveBeenCalledWith(
        message.scanReference,
        trackingInfo,
      );
    });

    it('debe retornar bandera de reintento cuando el estado de validación es PENDING', async () => {
      // Arrange
      const message = { ...defaultMessage };
      const trackingInfo = { ...defaultTrackingInfo };

      // Modify the mock to return PENDING
      mockGetDocumentValidationStatusUseCase.execute.mockResolvedValueOnce({
        status: DocumentValidationStatus.PENDING,
        timestamp: '2023-08-01T10:15:00Z',
        scanReference: 'test-scan-reference',
      });

      // Spy on the processDocumentValidationMessage method to verify that it is called recursively
      jest.spyOn(service, 'processDocumentValidationMessage');

      // Act
      const result = await service.processDocumentValidationMessage(
        message,
        trackingInfo,
      );

      // Assert
      expect(result).toEqual({ retry: true, message });
      expect(
        mockGetDocumentValidationStatusUseCase.execute,
      ).toHaveBeenCalledWith(message.scanReference, trackingInfo);
      // Verify that setTimeout was called
      expect(setTimeout).toHaveBeenCalled();
      // Verify that the method is called recursively with the updated message
      expect(service.processDocumentValidationMessage).toHaveBeenCalledTimes(2);
    });

    it('debe manejar errores en reintento automático correctamente', async () => {
      // Arrange
      const message = { ...defaultMessage };
      const trackingInfo = { ...defaultTrackingInfo };

      // Modify the mock to return PENDING
      mockGetDocumentValidationStatusUseCase.execute.mockResolvedValueOnce({
        status: DocumentValidationStatus.PENDING,
        timestamp: '2023-08-01T10:15:00Z',
        scanReference: 'test-scan-reference',
      });

      // Simular que el primer setTimeout encuentra un error, para que ejecute el segundo setTimeout
      const originalSetTimeout = global.setTimeout;
      let firstTimeoutExecuted = false;
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        if (!firstTimeoutExecuted) {
          // En la primera llamada a setTimeout, ejecutamos la función pero forzamos un error
          firstTimeoutExecuted = true;
          try {
            fn();
            throw new Error('Error in auto-retry');
          } catch (error) {
            // Permitir que el código maneje el error y llegue al segundo setTimeout
          }
        } else {
          // Para el segundo setTimeout, simplemente ejecutar la función
          fn();
        }
        return 123 as any;
      });

      try {
        // Act
        const result = await service.processDocumentValidationMessage(
          message,
          trackingInfo,
        );

        // Assert
        expect(result).toEqual(
          expect.objectContaining({
            retry: true,
          }),
        );
      } finally {
        // Restaurar setTimeout
        global.setTimeout = originalSetTimeout;
      }
    });

    it('debe manejar errores anidados en el mecanismo de reintento automático', async () => {
      // Arrange
      const message = { ...defaultMessage };
      const trackingInfo = { ...defaultTrackingInfo };

      // Modificar el mock para que devuelva PENDING
      mockGetDocumentValidationStatusUseCase.execute.mockResolvedValueOnce({
        status: DocumentValidationStatus.PENDING,
        timestamp: '2023-08-01T10:15:00Z',
        scanReference: 'test-scan-reference',
      });

      // Simular que el primer setTimeout encuentra un error, para que ejecute el segundo setTimeout
      const originalSetTimeout = global.setTimeout;
      let firstTimeoutExecuted = false;
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        if (!firstTimeoutExecuted) {
          // En la primera llamada a setTimeout, ejecutamos la función pero forzamos un error
          firstTimeoutExecuted = true;
          try {
            fn();
            throw new Error('Error in auto-retry');
          } catch (error) {
            // Permitir que el código maneje el error y llegue al segundo setTimeout
          }
        } else {
          // Para el segundo setTimeout, simplemente ejecutar la función
          fn();
        }
        return 123 as any;
      });

      try {
        // Act
        const result = await service.processDocumentValidationMessage(
          message,
          trackingInfo,
        );

        // Assert
        expect(result).toEqual(
          expect.objectContaining({
            retry: true,
          }),
        );
      } finally {
        // Restaurar setTimeout
        global.setTimeout = originalSetTimeout;
      }
    });

    it('debe manejar documentData indefinido cuando hay un error al obtener datos del documento', async () => {
      // Arrange
      const message = { ...defaultMessage };
      const trackingInfo = { ...defaultTrackingInfo };

      // El estado es DONE
      mockGetDocumentValidationStatusUseCase.execute.mockResolvedValueOnce({
        status: DocumentValidationStatus.DONE,
        timestamp: '2023-08-01T10:15:00Z',
        scanReference: 'test-scan-reference',
      });

      // Simular error al obtener los datos del documento
      mockGetDocumentValidationDataUseCase.execute.mockRejectedValueOnce(
        new Error('Error getting document data'),
      );

      // Hacer que updateOnboardingState se ejecute correctamente
      mockOnboardingClient.updateOnboardingState.mockResolvedValueOnce({
        statusCode: 200,
      });

      // Act
      const result = await service.processDocumentValidationMessage(
        message,
        trackingInfo,
      );

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          status: DocumentValidationStatus.FAILED,
          retry: false,
          data: undefined,
        }),
      );

      // La llamada a updateOnboardingState debe ocurrir aún sin documentData
      expect(mockOnboardingClient.updateOnboardingState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          data: expect.not.objectContaining({
            documentData: expect.anything(),
          }),
        }),
        'cnb-document',
      );
    });

    it('debe manejar errores al obtener datos del documento', async () => {
      // Arrange
      const message = { ...defaultMessage };
      const trackingInfo = { ...defaultTrackingInfo };

      // The status is DONE but there is an error when getting the data
      mockGetDocumentValidationStatusUseCase.execute.mockResolvedValueOnce({
        status: DocumentValidationStatus.DONE,
        timestamp: '2023-08-01T10:15:00Z',
        scanReference: 'test-scan-reference',
      });

      // Simulate an error when getting the document data
      mockGetDocumentValidationDataUseCase.execute.mockRejectedValueOnce(
        new Error('Error getting document data'),
      );

      // Make that updateOnboardingState is executed correctly
      mockOnboardingClient.updateOnboardingState.mockResolvedValueOnce({
        statusCode: 200,
      });

      // Act
      const result = await service.processDocumentValidationMessage(
        message,
        trackingInfo,
      );

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          status: DocumentValidationStatus.FAILED,
          retry: false,
        }),
      );

      // Verify that updateOnboardingState was called with the correct parameters
      expect(mockOnboardingClient.updateOnboardingState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          data: expect.objectContaining({
            statusResultValidation: expect.any(String),
          }),
        }),
        'cnb-document',
      );
    });
  });
});
