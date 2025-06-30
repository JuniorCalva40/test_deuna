import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@deuna/tl-logger-nd';
import { GetDocumentValidationDataUseCase } from './get-document-validation-data.use-case';
import { DOCUMENT_VALIDATION_CLIENT_PORT } from '../../domain/constants/injection.constants';
import { DocumentValidationResultStatus } from '../../domain/enums/document-validation.enum';

jest.mock('@deuna/tl-logger-nd');

describe('GetDocumentValidationDataUseCase', () => {
  let useCase: GetDocumentValidationDataUseCase;
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
      getValidationData: jest.fn(),
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
        GetDocumentValidationDataUseCase,
        {
          provide: DOCUMENT_VALIDATION_CLIENT_PORT,
          useValue: documentValidationClient,
        },
      ],
    }).compile();

    useCase = module.get<GetDocumentValidationDataUseCase>(
      GetDocumentValidationDataUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should get validation data successfully', async () => {
    // Arrange
    const mockResponse = {
      status: DocumentValidationResultStatus.APPROVED_VERIFIED,
      docNumber: '12345678',
      docType: 'DNI',
      expirationDate: '2030-01-01',
      firstName: 'John',
      lastName: 'Doe',
      nationality: 'PE',
    } as any;

    documentValidationClient.getValidationData.mockResolvedValue(mockResponse);

    // Act
    const result = await useCase.execute(mockScanReference, mockTrackingData);

    // Assert
    expect(documentValidationClient.getValidationData).toHaveBeenCalledWith(
      mockScanReference,
      mockTrackingData,
    );
    expect(result).toEqual({
      status: DocumentValidationResultStatus.APPROVED_VERIFIED,
      docNumber: '12345678',
      docType: 'DNI',
      expirationDate: '2030-01-01',
      firstName: 'John',
      lastName: 'Doe',
      nationality: 'PE',
    });
  });

  it('should handle errors and rethrow them', async () => {
    // Arrange
    const mockError = new Error('API Error');
    documentValidationClient.getValidationData.mockRejectedValue(mockError);

    // Act & Assert
    await expect(
      useCase.execute(mockScanReference, mockTrackingData),
    ).rejects.toThrow('API Error');

    expect(documentValidationClient.getValidationData).toHaveBeenCalledWith(
      mockScanReference,
      mockTrackingData,
    );
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it('should format response correctly when missing optional fields', async () => {
    // Arrange
    const mockResponse = {
      status: DocumentValidationResultStatus.APPROVED_VERIFIED,
      // Sin campos opcionales
    } as any;

    documentValidationClient.getValidationData.mockResolvedValue(mockResponse);

    // Act
    const result = await useCase.execute(mockScanReference, mockTrackingData);

    // Assert
    expect(documentValidationClient.getValidationData).toHaveBeenCalledWith(
      mockScanReference,
      mockTrackingData,
    );
    expect(result).toEqual({
      status: DocumentValidationResultStatus.APPROVED_VERIFIED,
    });
  });

  it('should include all data from response in result', async () => {
    // Arrange
    const mockResponse = {
      status: DocumentValidationResultStatus.APPROVED_VERIFIED,
      docNumber: '12345678',
      docType: 'DNI',
      expirationDate: '2030-01-01',
      firstName: 'John',
      lastName: 'Doe',
      nationality: 'PE',
      additionalField: 'some-value',
    } as any;

    documentValidationClient.getValidationData.mockResolvedValue(mockResponse);

    // Act
    const result = await useCase.execute(mockScanReference, mockTrackingData);

    // Assert
    expect(result).toEqual({
      status: DocumentValidationResultStatus.APPROVED_VERIFIED,
      docNumber: '12345678',
      docType: 'DNI',
      expirationDate: '2030-01-01',
      firstName: 'John',
      lastName: 'Doe',
      nationality: 'PE',
      additionalField: 'some-value',
    });
  });
});
