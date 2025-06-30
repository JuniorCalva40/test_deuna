import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@deuna/tl-logger-nd';
import { GetDocumentValidationStatusUseCase } from './get-document-validation-status.use-case';
import { DOCUMENT_VALIDATION_CLIENT_PORT } from '../../domain/constants/injection.constants';
import { DocumentValidationStatus } from '../../domain/enums/document-validation.enum';
import { DocumentValidationStatusResponse } from '../dto/document-validation-response.dto';

jest.mock('@deuna/tl-logger-nd');

describe('GetDocumentValidationStatusUseCase', () => {
  let useCase: GetDocumentValidationStatusUseCase;
  let documentValidationClient: any;
  let loggerMock: jest.Mocked<Logger>;

  const mockTrackingData = {
    trackingId: 'test-tracking-id',
    sessionId: 'test-session-id',
    requestId: 'test-request-id',
  };

  const mockScanReference = 'test-scan-reference';

  beforeEach(async () => {
    documentValidationClient = {
      getValidationStatus: jest.fn(),
    };

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
        GetDocumentValidationStatusUseCase,
        {
          provide: DOCUMENT_VALIDATION_CLIENT_PORT,
          useValue: documentValidationClient,
        },
      ],
    }).compile();

    useCase = module.get<GetDocumentValidationStatusUseCase>(
      GetDocumentValidationStatusUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should get validation status successfully', async () => {
    // Arrange
    const mockResponse: DocumentValidationStatusResponse = {
      status: DocumentValidationStatus.DONE,
      timestamp: '2023-08-01T12:34:56Z',
      scanReference: mockScanReference,
    };

    documentValidationClient.getValidationStatus.mockResolvedValue(
      mockResponse,
    );

    // Act
    const result = await useCase.execute(mockScanReference, mockTrackingData);

    // Assert
    expect(documentValidationClient.getValidationStatus).toHaveBeenCalledWith(
      mockScanReference,
      mockTrackingData,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors and rethrow them', async () => {
    // Arrange
    const mockError = new Error('API Error');
    documentValidationClient.getValidationStatus.mockRejectedValue(mockError);

    // Act & Assert
    await expect(
      useCase.execute(mockScanReference, mockTrackingData),
    ).rejects.toThrow('API Error');

    expect(documentValidationClient.getValidationStatus).toHaveBeenCalledWith(
      mockScanReference,
      mockTrackingData,
    );
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it('should handle different validation status types', async () => {
    // Arrange
    const mockResponse: DocumentValidationStatusResponse = {
      status: DocumentValidationStatus.PENDING,
      timestamp: '2023-08-01T12:34:56Z',
      scanReference: mockScanReference,
    };

    documentValidationClient.getValidationStatus.mockResolvedValue(
      mockResponse,
    );

    // Act
    const result = await useCase.execute(mockScanReference, mockTrackingData);

    // Assert
    expect(result.status).toBe(DocumentValidationStatus.PENDING);
    expect(result.scanReference).toBe(mockScanReference);
  });

  it('should pass tracking data to client correctly', async () => {
    // Arrange
    const mockResponse: DocumentValidationStatusResponse = {
      status: DocumentValidationStatus.DONE,
      timestamp: '2023-08-01T12:34:56Z',
      scanReference: mockScanReference,
    };

    documentValidationClient.getValidationStatus.mockResolvedValue(
      mockResponse,
    );

    // Act
    await useCase.execute(mockScanReference, mockTrackingData);

    // Assert
    expect(documentValidationClient.getValidationStatus).toHaveBeenCalledWith(
      mockScanReference,
      {
        trackingId: 'test-tracking-id',
        sessionId: 'test-session-id',
        requestId: 'test-request-id',
      },
    );
  });
});
