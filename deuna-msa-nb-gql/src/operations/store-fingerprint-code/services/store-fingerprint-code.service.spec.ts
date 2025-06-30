import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { StoreFingeprintCodeService } from './store-fingerprint-code.service';
import { FingeprintCodeInputDto } from '../dto/fingerprint-code-input.dto';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ErrorHandler } from '../../../utils/error-handler.util';

// Mock para ErrorHandler
jest.mock('../../../utils/error-handler.util', () => ({
  ErrorHandler: {
    handleError: jest.fn().mockImplementation((error) => {
      return {
        status: 'ERROR',
        message: error.message || 'Error message',
      };
    }),
  },
}));

describe('StoreFingeprintCodeService', () => {
  let service: StoreFingeprintCodeService;
  let mockMsaCoOnboardingStatusService: any;
  let mockMsaNbCnbOrqService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockMsaCoOnboardingStatusService = {
      setFingerprintStep: jest.fn(),
    };

    mockMsaNbCnbOrqService = {
      createElectronicSign: jest.fn(),
      updateElectronicSign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreFingeprintCodeService,
        {
          provide: 'MSA_CO_ONBOARDING_STATE_SERVICE',
          useValue: mockMsaCoOnboardingStatusService,
        },
        {
          provide: 'MSA_NB_CNB_ORQ_SERVICE',
          useValue: mockMsaNbCnbOrqService,
        },
      ],
    }).compile();

    service = module.get<StoreFingeprintCodeService>(
      StoreFingeprintCodeService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('storeFingeprintCode', () => {
    const mockFingeprintData: FingeprintCodeInputDto = {
      onboardingSessionId: '6f9aae94-1616-41cf-8cdc-ca7b0f4271c3',
      nationalID: 'mock_national_id',
      fingerprintData: 'mock_fingerprint_data',
      identificationNumber: 'test-id-number',
      trackingId: 'test-tracking-id',
      requestId: 'test-request-id',
      sessionId: 'test-session-id',
    };

    const mockFingeprintDataResponse = {
      status: 'SUCCESS',
      message: '',
    };

    it('should successfully store fingerprint code', async () => {
      // Configurar los mocks
      mockMsaCoOnboardingStatusService.setFingerprintStep.mockReturnValue(
        of(mockFingeprintDataResponse),
      );

      mockMsaNbCnbOrqService.updateElectronicSign.mockResolvedValue({
        status: 'SUCCESS',
      });

      const result = await service.storeFingeprintCode(mockFingeprintData);

      expect(result).toEqual({
        status: 'SUCCESS',
        message: '',
      });

      expect(
        mockMsaCoOnboardingStatusService.setFingerprintStep,
      ).toHaveBeenCalledWith({
        sessionId: mockFingeprintData.onboardingSessionId,
        status: 'SUCCESS',
        data: {
          nationalID: mockFingeprintData.nationalID,
          fingerprintData: mockFingeprintData.fingerprintData,
        },
      });

      expect(mockMsaNbCnbOrqService.updateElectronicSign).toHaveBeenCalledWith(
        {
          identificationNumber: mockFingeprintData.identificationNumber,
          fingerCode: mockFingeprintData.fingerprintData,
        },
        {
          sessionId: mockFingeprintData.sessionId,
          trackingId: mockFingeprintData.trackingId,
          requestId: mockFingeprintData.requestId,
        },
      );
    });

    // Test para validar que falle cuando falta el nationalID (línea 35)
    it('should fail when nationalID is missing', async () => {
      const invalidInput = {
        ...mockFingeprintData,
        nationalID: '',
      };

      await service.storeFingeprintCode(invalidInput);

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.ONB_DATA_INCOMPLETE,
          message: 'National ID is required',
        },
        'store-fingerprint-code',
      );
    });

    // Test para validar que falle cuando setFingerprintStep devuelve null (línea 88)
    it('should fail when setFingerprintStep returns null', async () => {
      mockMsaCoOnboardingStatusService.setFingerprintStep.mockReturnValue(
        of(null),
      );

      await service.storeFingeprintCode(mockFingeprintData);

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.FINGERPRINT_ERROR,
          message: 'Failed to store fingerprint code',
        },
        'store-fingerprint-code',
      );
    });

    // Test para validar que falle cuando createElectronicSign devuelve null (línea 100)
    it('should fail when createElectronicSign returns null', async () => {
      mockMsaCoOnboardingStatusService.setFingerprintStep.mockReturnValue(
        of(mockFingeprintDataResponse),
      );

      mockMsaNbCnbOrqService.updateElectronicSign.mockResolvedValue(null);

      await service.storeFingeprintCode(mockFingeprintData);

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        {
          code: ErrorCodes.REDIS_SAVE_ERROR,
          message:
            'Failed to update electronic signature request data in msa-nb-cnb-orq',
        },
        'store-fingerprint-code',
      );
    });

    // Test para cubrir bloque catch (líneas 117-118)
    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      // Provocar un error inesperado en setFingerprintStep
      mockMsaCoOnboardingStatusService.setFingerprintStep.mockReturnValue(
        throwError(() => error),
      );

      await service.storeFingeprintCode(mockFingeprintData);

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        'store-fingerprint-code',
      );
    });
  });
});
