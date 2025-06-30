// Mock del formatLogger antes de importar el módulo
jest.mock('../../domain/utils/format-logger', () => ({
  formatLogger: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { StartDocumentValidationUseCase } from './start-document-validation.use-case';
import { DocumentValidationPort } from '../../domain/ports/document-validation.port';
import { DocumentValidationStartDto } from '../dto/document-validation-start.dto';
import { DocumentValidationStartResponse } from '../dto/document-validation-response.dto';
import { DOCUMENT_VALIDATION_PORT } from '../../domain/constants/injection.constants';
import { DocumentValidationType } from '../../domain/enums/document-validation-type.enum';
import { formatLogger } from '../../domain/utils/format-logger';

// Mock del Logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('StartDocumentValidationUseCase', () => {
  let useCase: StartDocumentValidationUseCase;
  let documentValidationPort: DocumentValidationPort;

  // Datos de prueba
  const mockTrackingData = {
    trackingId: 'test-tracking-id',
    sessionId: 'test-session-id',
    requestId: 'test-request-id',
  };

  const mockInput: DocumentValidationStartDto = {
    ...mockTrackingData,
    onboardingSessionId: 'test-onboarding-session-id',
    merchantIdScanReference: 'test-merchant-scan-reference',
    frontsideImage: 'data:image/jpeg;base64,test-frontside-image',
    backsideImage: 'data:image/jpeg;base64,test-backside-image',
    country: 'ECU',
    idType: DocumentValidationType.DNI,
  };

  const mockResponse: DocumentValidationStartResponse = {
    timestamp: '2023-10-25T12:30:45Z',
    scanReference: 'test-scan-reference-123',
    type: 'ID_VALIDATION',
  };

  beforeEach(async () => {
    // Clear mocks before each test
    jest.clearAllMocks();

    // Create mock for document validation port
    documentValidationPort = {
      startValidation: jest.fn(),
      getValidationStatus: jest.fn(),
      getValidationData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartDocumentValidationUseCase,
        {
          provide: DOCUMENT_VALIDATION_PORT,
          useValue: documentValidationPort,
        },
      ],
    }).compile();

    useCase = module.get<StartDocumentValidationUseCase>(
      StartDocumentValidationUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should start a document validation process successfully', async () => {
    // Arrange
    jest
      .spyOn(documentValidationPort, 'startValidation')
      .mockResolvedValue(mockResponse);

    // Act
    const result = await useCase.execute(mockInput);

    // Assert
    expect(documentValidationPort.startValidation).toHaveBeenCalledWith(
      mockInput,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors properly and propagate them', async () => {
    // Arrange
    const testError = new Error('Test validation error');
    jest
      .spyOn(documentValidationPort, 'startValidation')
      .mockRejectedValue(testError);

    // Act & Assert
    await expect(useCase.execute(mockInput)).rejects.toThrow(testError);

    expect(documentValidationPort.startValidation).toHaveBeenCalledWith(
      mockInput,
    );
  });

  it('should log error details when validation fails', async () => {
    // Arrange
    const testError = new Error('Test validation error');
    jest
      .spyOn(documentValidationPort, 'startValidation')
      .mockRejectedValue(testError);

    // Act & Assert
    await expect(useCase.execute(mockInput)).rejects.toThrow(testError);

    expect(formatLogger).toHaveBeenCalledWith(
      expect.anything(),
      'error',
      `UseCase - Error in document validation process: ${testError.message}`,
      mockInput.sessionId,
      mockInput.trackingId,
      mockInput.requestId,
    );
  });
});
