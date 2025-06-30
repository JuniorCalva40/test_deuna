import { KycController } from './kyc-start-biometric-validation.controller';
import { Logger } from '@nestjs/common';
import { KycBiometricValidationServicePort } from '../../../application/ports/in/services/kyc-biometric.service.port';

interface KycBiometricRequestDto {
  scanId: string;
  facialValidation: any;
  livenessValidation: any;
  onboardingSessionId: string;
}

interface KycResponseDto {
  scanId: string;
  status?: string;
}

jest.mock('@src/domain/utils/validator-tracking-headers-api', () => ({
  validateTrackingHeadersApi: jest.fn(),
}));

import { validateTrackingHeadersApi } from '@src/domain/utils/validator-tracking-headers-api';

describe('KycController', () => {
  let controller: KycController;
  let kycServiceMock: jest.Mocked<KycBiometricValidationServicePort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    kycServiceMock = {
      startBiometricValidation: jest.fn(),
    } as unknown as jest.Mocked<KycBiometricValidationServicePort>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    controller = new KycController(kycServiceMock as any, loggerMock as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submitKyc', () => {
    it('should call startValidation with correct parameters', async () => {
      // Arrange
      const request: KycBiometricRequestDto = {
        scanId: 'test-scan-id',
        facialValidation: {
          documentType: 'CEDULA',
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
        },
        livenessValidation: {
          selfieImage: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        },
        onboardingSessionId: 'test-session-id',
      };

      const sessionId = 'test-session-id';
      const trackingId = 'test-tracking-id';
      const requestId = 'test-request-id';

      const expectedResponse: KycResponseDto = {
        scanId: 'test-scan-id',
        status: 'IN_PROGRESS',
      };

      kycServiceMock.startBiometricValidation.mockResolvedValue(
        expectedResponse,
      );

      // Act
      const result = await controller.submitKyc(
        request,
        sessionId,
        trackingId,
        requestId,
      );

      // Assert
      expect(validateTrackingHeadersApi).toHaveBeenCalledWith(
        loggerMock,
        'Starting KYC Orchestrator Request -Controller',
        sessionId,
        trackingId,
        requestId,
      );

      expect(kycServiceMock.startBiometricValidation).toHaveBeenCalledWith(
        request.facialValidation,
        request.livenessValidation,
        request.onboardingSessionId,
        sessionId,
        trackingId,
      );

      expect(result).toEqual(expectedResponse);
    });

    it('should handle and propagate errors', async () => {
      // Arrange
      const request: KycBiometricRequestDto = {
        scanId: 'test-scan-id',
        facialValidation: {},
        livenessValidation: {},
        onboardingSessionId: 'test-session-id',
      };

      const sessionId = 'test-session-id';
      const trackingId = 'test-tracking-id';
      const requestId = 'test-request-id';

      const expectedError = new Error('Service unavailable');
      kycServiceMock.startBiometricValidation.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(
        controller.submitKyc(request, sessionId, trackingId, requestId),
      ).rejects.toThrow(expectedError);

      expect(validateTrackingHeadersApi).toHaveBeenCalledWith(
        loggerMock,
        'Starting KYC Orchestrator Request -Controller',
        sessionId,
        trackingId,
        requestId,
      );
    });
  });
});
