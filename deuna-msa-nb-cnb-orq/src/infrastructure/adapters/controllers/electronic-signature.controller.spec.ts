import { Test, TestingModule } from '@nestjs/testing';
import { ElectronicSignatureController } from './electronic-signature.controller';
import { Logger } from '@deuna/tl-logger-nd';
import { ELECTRONIC_SIGNATURE_PORT } from '../../../application/ports/in/services/electronic-signature.service.port';
import { ElectronicSignatureRequestDto } from '../../../application/dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureResponseDto } from '../../../application/dto/electronic-signature/electronic-signature-redis-response.dto';
import { ElectronicSignatureUpdateDto } from '../../../application/dto/electronic-signature/electronic-signature-update.dto';
import { ElectronicSignatureUpdateResponseDto } from '../../../application/dto/electronic-signature/electronic-signature-update-redis-response.dto';
import { ElectronicSignatureGetResponseDto } from '../../../application/dto/electronic-signature/electronic-signature-get-response.dto';
import { ElectronicSignatureProcessResponseDto } from '../../../application/dto/electronic-signature/electronic-signature-process-response.dto';

// Mock del Logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('ElectronicSignatureController', () => {
  let controller: ElectronicSignatureController;
  let electronicSignatureService: any;

  const mockHeaders = {
    sessionId: 'test-session-id',
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
  };

  const mockSignatureRequestDto: ElectronicSignatureRequestDto = {
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

  const mockUpdateDto: ElectronicSignatureUpdateDto = {
    applicantName: 'Updated Name',
    applicantLastName: 'Updated LastName',
    emailAddress: 'updated@example.com',
    cellphoneNumber: '+593987654322',
  };

  const mockSignatureResponseDto: ElectronicSignatureResponseDto = {
    status: 'SAVED',
    message: 'Electronic signature request saved successfully in redis-db',
  };

  const mockUpdateResponseDto: ElectronicSignatureUpdateResponseDto = {
    status: 'UPDATED',
    message: 'Electronic signature request updated successfully',
  };

  const mockGetResponseDto: ElectronicSignatureGetResponseDto = {
    status: 'SUCCESS',
    message: 'Electronic signature request retrieved successfully',
    data: mockSignatureRequestDto,
  };

  const mockProcessResponseDto: ElectronicSignatureProcessResponseDto = {
    status: 'PROCESSED',
    message: 'Electronic signature request processed successfully',
  };

  beforeEach(async () => {
    // Create mock for service
    electronicSignatureService = {
      saveSignatureRequest: jest
        .fn()
        .mockResolvedValue(mockSignatureResponseDto),
      updateSignatureRequest: jest
        .fn()
        .mockResolvedValue(mockUpdateResponseDto),
      getSignatureRequest: jest.fn().mockResolvedValue(mockGetResponseDto),
      processDigitalSignature: jest.fn().mockResolvedValue(mockProcessResponseDto),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectronicSignatureController],
      providers: [
        {
          provide: ELECTRONIC_SIGNATURE_PORT,
          useValue: electronicSignatureService,
        },
        Logger,
      ],
    }).compile();

    controller = module.get<ElectronicSignatureController>(
      ElectronicSignatureController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerSignatureRequest', () => {
    it('should register a signature request successfully', async () => {
      // Act
      const result = await controller.registerSignatureRequest(
        mockSignatureRequestDto,
        mockHeaders.sessionId,
        mockHeaders.trackingId,
        mockHeaders.requestId,
      );

      // Assert
      expect(
        electronicSignatureService.saveSignatureRequest,
      ).toHaveBeenCalledWith(
        mockSignatureRequestDto,
        mockHeaders.sessionId,
        mockHeaders.trackingId,
        mockHeaders.requestId,
      );
      expect(result).toEqual(mockSignatureResponseDto);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const testError = new Error('Test error');
      electronicSignatureService.saveSignatureRequest.mockRejectedValueOnce(
        testError,
      );

      // Act & Assert
      await expect(
        controller.registerSignatureRequest(
          mockSignatureRequestDto,
          mockHeaders.sessionId,
          mockHeaders.trackingId,
          mockHeaders.requestId,
        ),
      ).rejects.toThrow(testError);
    });
  });

  describe('updateSignatureRequest', () => {
    it('should update a signature request successfully', async () => {
      // Arrange
      const identificationNumber = '0987654321';

      // Act
      const result = await controller.updateSignatureRequest(
        identificationNumber,
        mockUpdateDto,
        mockHeaders.sessionId,
        mockHeaders.trackingId,
        mockHeaders.requestId,
      );

      // Assert
      expect(
        electronicSignatureService.updateSignatureRequest,
      ).toHaveBeenCalledWith(
        identificationNumber,
        mockUpdateDto,
        mockHeaders.sessionId,
        mockHeaders.trackingId,
        mockHeaders.requestId,
      );
      expect(result).toEqual(mockUpdateResponseDto);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const identificationNumber = '0987654321';
      const testError = new Error('Test error');
      electronicSignatureService.updateSignatureRequest.mockRejectedValueOnce(
        testError,
      );

      // Act & Assert
      await expect(
        controller.updateSignatureRequest(
          identificationNumber,
          mockUpdateDto,
          mockHeaders.sessionId,
          mockHeaders.trackingId,
          mockHeaders.requestId,
        ),
      ).rejects.toThrow(testError);
    });
  });

  describe('getSignatureRequest', () => {
    it('should get a signature request successfully', async () => {
      // Arrange
      const identificationNumber = '0987654321';

      // Act
      const result = await controller.getSignatureRequest(
        identificationNumber,
        mockHeaders.sessionId,
        mockHeaders.trackingId,
        mockHeaders.requestId,
      );

      // Assert
      expect(
        electronicSignatureService.getSignatureRequest,
      ).toHaveBeenCalledWith(
        identificationNumber,
        mockHeaders.sessionId,
        mockHeaders.trackingId,
        mockHeaders.requestId,
      );
      expect(result).toEqual(mockGetResponseDto);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const identificationNumber = '0987654321';
      const testError = new Error('Test error');
      electronicSignatureService.getSignatureRequest.mockRejectedValueOnce(
        testError,
      );

      // Act & Assert
      await expect(
        controller.getSignatureRequest(
          identificationNumber,
          mockHeaders.sessionId,
          mockHeaders.trackingId,
          mockHeaders.requestId,
        ),
      ).rejects.toThrow(testError);
    });
  });

  describe('processSignatureRequest', () => {
    it('should process a signature request successfully', async () => {
      // Arrange
      const identificationNumber = '0987654321';

      // Act
      const result = await controller.processSignatureRequest(
        identificationNumber,
        mockHeaders.sessionId,
        mockHeaders.trackingId,
        mockHeaders.requestId,
      );

      // Assert
      expect(
        electronicSignatureService.processDigitalSignature,
      ).toHaveBeenCalledWith(
        identificationNumber,
        mockHeaders.sessionId,
        mockHeaders.trackingId,
        mockHeaders.requestId,
      );
      expect(result).toEqual(mockProcessResponseDto);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const identificationNumber = '0987654321';
      const testError = new Error('Test error');
      electronicSignatureService.processDigitalSignature.mockRejectedValueOnce(
        testError,
      );

      // Act & Assert
      await expect(
        controller.processSignatureRequest(
          identificationNumber,
          mockHeaders.sessionId,
          mockHeaders.trackingId,
          mockHeaders.requestId,
        ),
      ).rejects.toThrow(testError);
    });
  });
});
