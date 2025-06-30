import { Test, TestingModule } from '@nestjs/testing';
import { ElectronicSignatureService } from './electronic-signature.service';
import { SaveSignatureRequestUseCase } from '../use-cases/electronic-signature/save-signature-request.use-case';
import { UpdateSignatureRequestUseCase } from '../use-cases/electronic-signature/update-signature-request.use-case';
import { GetSignatureRequestUseCase } from '../use-cases/electronic-signature/get-signature-request.use-case';
import { ProcessDigitalSignatureUseCase } from '../use-cases/electronic-signature/process-digital-signature.use-case';
import { ElectronicSignatureRequestDto } from '../dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureUpdateDto } from '../dto/electronic-signature/electronic-signature-update.dto';
import { validateElectronicSignatureData } from '../../domain/utils/electronic-signature-validator';
import { DetokenizeImageUseCase } from '../use-cases/detokenize/detokenize-image.use-case';
import { DetokenizeResponseDto } from '../dto/detokenize/detokenize-response.dto';

// Mock del Logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Mockeamos el validador
jest.mock('../../domain/utils/electronic-signature-validator', () => ({
  validateElectronicSignatureData: jest.fn(),
}));

describe('ElectronicSignatureService', () => {
  let service: ElectronicSignatureService;
  let saveSignatureRequestUseCase: SaveSignatureRequestUseCase;
  let updateSignatureRequestUseCase: UpdateSignatureRequestUseCase;
  let getSignatureRequestUseCase: GetSignatureRequestUseCase;
  let processDigitalSignatureUseCase: ProcessDigitalSignatureUseCase;
  let detokenizeImageUseCase: DetokenizeImageUseCase;

  const mockTrackingData = {
    sessionId: 'test-session-id',
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
  };

  const mockRequestData: ElectronicSignatureRequestDto = {
    identificationNumber: '0987654321',
    applicantName: 'Test Name',
    applicantLastName: 'Test LastName',
    fingerCode: 'FP123456',
    emailAddress: 'test@example.com',
    cellphoneNumber: '+593987654321',
    city: 'Test City',
    province: 'Test Province',
    address: 'Test Address 123',
    fileIdentificationFront: 'data:image/jpeg;base64,test...',
    fileIdentificationBack: 'data:image/jpeg;base64,test...',
    fileIdentificationSelfie: 'data:image/png;base64,test...',
  };

  const mockUpdateData: ElectronicSignatureUpdateDto = {
    emailAddress: 'updated@example.com',
    cellphoneNumber: '+593999999999',
  };

  // Mock para la respuesta del proceso de detokenización
  const mockDetokenizeSuccessResponse: DetokenizeResponseDto = {
    status: 'SUCCESS',
    message: 'Image detokenized successfully',
    imageData: 'data:image/png;base64,detokenized-data...',
  };

  const mockDetokenizeErrorResponse: DetokenizeResponseDto = {
    status: 'ERROR',
    message: 'Failed to detokenize image',
    imageData: null,
  };

  beforeEach(async () => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();

    // Crear mocks para los casos de uso
    saveSignatureRequestUseCase = {
      execute: jest.fn(),
    } as unknown as SaveSignatureRequestUseCase;

    updateSignatureRequestUseCase = {
      execute: jest.fn(),
    } as unknown as UpdateSignatureRequestUseCase;

    getSignatureRequestUseCase = {
      execute: jest.fn(),
    } as unknown as GetSignatureRequestUseCase;

    processDigitalSignatureUseCase = {
      execute: jest.fn(),
    } as unknown as ProcessDigitalSignatureUseCase;

    detokenizeImageUseCase = {
      execute: jest.fn(),
    } as unknown as DetokenizeImageUseCase;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectronicSignatureService,
        {
          provide: SaveSignatureRequestUseCase,
          useValue: saveSignatureRequestUseCase,
        },
        {
          provide: UpdateSignatureRequestUseCase,
          useValue: updateSignatureRequestUseCase,
        },
        {
          provide: GetSignatureRequestUseCase,
          useValue: getSignatureRequestUseCase,
        },
        {
          provide: ProcessDigitalSignatureUseCase,
          useValue: processDigitalSignatureUseCase,
        },
        {
          provide: DetokenizeImageUseCase,
          useValue: detokenizeImageUseCase,
        },
      ],
    }).compile();

    service = module.get<ElectronicSignatureService>(
      ElectronicSignatureService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveSignatureRequest', () => {
    it('should save a signature request successfully', async () => {
      // Arrange
      jest
        .spyOn(saveSignatureRequestUseCase, 'execute')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.saveSignatureRequest(
        mockRequestData,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      expect(saveSignatureRequestUseCase.execute).toHaveBeenCalledWith(
        mockRequestData.identificationNumber,
        mockRequestData,
      );
      expect(result).toEqual({
        status: 'SAVED',
        message: 'Electronic signature request saved successfully in redis-db',
      });
    });

    it('should handle errors when saving fails', async () => {
      // Arrange
      const error = new Error('Test error');
      jest
        .spyOn(saveSignatureRequestUseCase, 'execute')
        .mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.saveSignatureRequest(
          mockRequestData,
          mockTrackingData.sessionId,
          mockTrackingData.trackingId,
          mockTrackingData.requestId,
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('updateSignatureRequest', () => {
    it('should update a signature request successfully', async () => {
      // Arrange
      jest
        .spyOn(updateSignatureRequestUseCase, 'execute')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.updateSignatureRequest(
        mockRequestData.identificationNumber,
        mockUpdateData,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      expect(updateSignatureRequestUseCase.execute).toHaveBeenCalledWith(
        mockRequestData.identificationNumber,
        mockUpdateData,
      );
      expect(result).toEqual({
        status: 'UPDATED',
        message:
          'Electronic signature request updated successfully in redis-db',
      });
    });

    it('should handle errors when updating fails', async () => {
      // Arrange
      const error = new Error('Test error');
      jest
        .spyOn(updateSignatureRequestUseCase, 'execute')
        .mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.updateSignatureRequest(
          mockRequestData.identificationNumber,
          mockUpdateData,
          mockTrackingData.sessionId,
          mockTrackingData.trackingId,
          mockTrackingData.requestId,
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('getSignatureRequest', () => {
    it('should retrieve a signature request successfully', async () => {
      // Arrange
      jest
        .spyOn(getSignatureRequestUseCase, 'execute')
        .mockResolvedValue(mockRequestData);

      // Act
      const result = await service.getSignatureRequest(
        mockRequestData.identificationNumber,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      expect(getSignatureRequestUseCase.execute).toHaveBeenCalledWith(
        mockRequestData.identificationNumber,
      );
      expect(result).toEqual({
        status: 'SUCCESS',
        message: 'Electronic signature request retrieved successfully',
        data: mockRequestData,
      });
    });

    it('should handle not found cases', async () => {
      // Arrange
      jest.spyOn(getSignatureRequestUseCase, 'execute').mockResolvedValue(null);

      // Act
      const result = await service.getSignatureRequest(
        mockRequestData.identificationNumber,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      expect(result).toEqual({
        status: 'NOT_FOUND',
        message: 'Electronic signature request not found',
        data: null,
      });
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const error = new Error('Test error');
      jest
        .spyOn(getSignatureRequestUseCase, 'execute')
        .mockRejectedValue(error);

      // Act
      const result = await service.getSignatureRequest(
        mockRequestData.identificationNumber,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      expect(result).toEqual({
        status: 'ERROR',
        message: `Error retrieving electronic signature request: ${error.message}`,
        data: null,
      });
    });
  });

  describe('processDigitalSignature', () => {
    it('should process a digital signature successfully', async () => {
      // Arrange
      jest
        .spyOn(getSignatureRequestUseCase, 'execute')
        .mockResolvedValue(mockRequestData);

      jest
        .spyOn(detokenizeImageUseCase, 'execute')
        .mockResolvedValue(mockDetokenizeSuccessResponse);

      jest.spyOn(processDigitalSignatureUseCase, 'execute').mockResolvedValue({
        status: 'PROCESSED',
        message: 'Digital signature processed successfully',
        referenceTransaction: 'DS-12345678',
      });

      // Act
      const result = await service.processDigitalSignature(
        mockRequestData.identificationNumber,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      expect(getSignatureRequestUseCase.execute).toHaveBeenCalledWith(
        mockRequestData.identificationNumber,
      );

      expect(detokenizeImageUseCase.execute).toHaveBeenCalledWith(
        mockRequestData.fileIdentificationSelfie,
        mockTrackingData,
      );

      const updatedRequestData = {
        ...mockRequestData,
        fileIdentificationSelfie: mockDetokenizeSuccessResponse.imageData,
      };

      expect(processDigitalSignatureUseCase.execute).toHaveBeenCalledWith(
        updatedRequestData,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      expect(result).toEqual({
        status: 'PROCESSED',
        message: 'Digital signature processed successfully',
        referenceTransaction: 'DS-12345678',
      });
    });

    it('should handle not found cases', async () => {
      // Arrange
      jest.spyOn(getSignatureRequestUseCase, 'execute').mockResolvedValue(null);

      // Act
      const result = await service.processDigitalSignature(
        mockRequestData.identificationNumber,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      expect(result).toEqual({
        status: 'NOT_FOUND',
        message: 'No data found for request digital signature processing',
      });
      expect(processDigitalSignatureUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle detokenization failure', async () => {
      // Arrange
      jest
        .spyOn(getSignatureRequestUseCase, 'execute')
        .mockResolvedValue(mockRequestData);

      jest
        .spyOn(detokenizeImageUseCase, 'execute')
        .mockResolvedValue(mockDetokenizeErrorResponse);

      // Act
      const result = await service.processDigitalSignature(
        mockRequestData.identificationNumber,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      expect(result).toEqual({
        status: 'FAILED',
        message:
          'Error processing digital signature: Failed to detokenize image',
      });
      expect(processDigitalSignatureUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      // Arrange
      jest
        .spyOn(getSignatureRequestUseCase, 'execute')
        .mockResolvedValue(mockRequestData);

      jest
        .spyOn(detokenizeImageUseCase, 'execute')
        .mockResolvedValue(mockDetokenizeSuccessResponse);

      const error = new Error('Test error');
      jest
        .spyOn(processDigitalSignatureUseCase, 'execute')
        .mockRejectedValue(error);

      // Act
      const result = await service.processDigitalSignature(
        mockRequestData.identificationNumber,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      expect(result).toEqual({
        status: 'FAILED',
        message: `Error processing digital signature: ${error.message}`,
      });
    });

    it('should validate the data retrieved from Redis', async () => {
      // Mock of the getSignatureRequestUseCase.execute function to return data
      jest
        .spyOn(getSignatureRequestUseCase, 'execute')
        .mockResolvedValue(mockRequestData);

      jest
        .spyOn(detokenizeImageUseCase, 'execute')
        .mockResolvedValue(mockDetokenizeSuccessResponse);

      // Mock of the processDigitalSignatureUseCase.execute function
      jest.spyOn(processDigitalSignatureUseCase, 'execute').mockResolvedValue({
        status: 'SUCCESS',
        message: 'Digital signature processed successfully',
        referenceTransaction: 'test-reference-id',
      });

      await service.processDigitalSignature(
        '1712345678',
        'session-id',
        'tracking-id',
        'request-id',
      );

      // Verify that validateElectronicSignatureData was called with the correct data
      expect(validateElectronicSignatureData).toHaveBeenCalledWith(
        mockRequestData,
      );
    });

    it('should return an error if the data does not pass the validation', async () => {
      // Mock of the getSignatureRequestUseCase.execute function to return data
      jest
        .spyOn(getSignatureRequestUseCase, 'execute')
        .mockResolvedValue(mockRequestData);

      // Mock of the validator to throw an error
      const validationError = new Error('Missing required field');
      (validateElectronicSignatureData as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      const result = await service.processDigitalSignature(
        '1712345678',
        'session-id',
        'tracking-id',
        'request-id',
      );

      expect(result).toEqual({
        status: 'FAILED',
        message: `Error processing digital signature: ${validationError.message}`,
      });
    });

    it('should handle errors in detokenizeFileIdentificationSelfie method', async () => {
      // Arrange
      jest
        .spyOn(getSignatureRequestUseCase, 'execute')
        .mockResolvedValue(mockRequestData);

      // Restore the default behavior of validateElectronicSignatureData
      (validateElectronicSignatureData as jest.Mock).mockImplementation(() => {
        return true; // The validation passes without errors
      });

      // Simulate an error specifically in the detokenization
      // Force the error to occur specifically in the catch block (lines 401-409)
      // using mockImplementation and throwing an error directly
      jest.spyOn(detokenizeImageUseCase, 'execute').mockImplementation(() => {
        throw new Error(
          'Error in the connection with the detokenization service',
        );
      });

      // Act
      const result = await service.processDigitalSignature(
        mockRequestData.identificationNumber,
        mockTrackingData.sessionId,
        mockTrackingData.trackingId,
        mockTrackingData.requestId,
      );

      // Assert
      // Verify that the error message from the catch block is returned
      expect(result).toEqual({
        status: 'FAILED',
        message:
          'Error processing digital signature: Failed to detokenize image',
      });
      // Verify that the digital signature processing was not called
      expect(processDigitalSignatureUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
