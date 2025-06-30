import { Test, TestingModule } from '@nestjs/testing';
import { StartBiometricValidationService } from './start-biometric-validation.service';
import { StartBiometricValidationInputDto } from '../dto/start-biometric-validation-input.dto';
import {
  MSA_NB_CNB_ORQ_SERVICE,
  IMsaNbCnbOrqService,
} from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { of, throwError } from 'rxjs';
import { ErrorHandler } from '../../../utils/error-handler.util';

// Mock Logger
jest.mock('@deuna/tl-logger-nd');

describe('StartBiometricValidationService', () => {
  let service: StartBiometricValidationService;
  let mockMsaNbCnbOrqService: jest.Mocked<IMsaNbCnbOrqService>;

  beforeEach(async () => {
    mockMsaNbCnbOrqService = {
      startBiometricValidation: jest.fn(),
      updateElectronicSign: jest.fn(),
      documentValidation: jest.fn(),
      notifyOnboardingFinish: jest.fn(),
      startElectronicSignatureProcess: jest.fn(),
      createElectronicSign: jest.fn(),
      saveCnbState: jest.fn(),
      getCnbState: jest.fn(),
      generateDocument: jest.fn(),
      queryDocument: jest.fn(),
    } as jest.Mocked<IMsaNbCnbOrqService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartBiometricValidationService,
        {
          provide: MSA_NB_CNB_ORQ_SERVICE,
          useValue: mockMsaNbCnbOrqService,
        },
      ],
    }).compile();

    service = module.get<StartBiometricValidationService>(
      StartBiometricValidationService,
    );
    mockMsaNbCnbOrqService.startBiometricValidation.mockReset();
    mockMsaNbCnbOrqService.updateElectronicSign.mockReset();
    mockMsaNbCnbOrqService.documentValidation.mockReset();
    mockMsaNbCnbOrqService.notifyOnboardingFinish.mockReset();
    mockMsaNbCnbOrqService.startElectronicSignatureProcess.mockReset();
    mockMsaNbCnbOrqService.createElectronicSign.mockReset();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startBiometricValidation', () => {
    const validInput: StartBiometricValidationInputDto = {
      facialAndLivenessValidation: {
        token1: 'testToken1',
        token2: 'testToken2',
        method: 1,
      },
      onboardingSessionId: 'testOnboardingId',
      identificationNumber: 'testIdNumber',
      sessionId: 'testSessionId',
      trackingId: 'testTrackingId',
      requestId: 'testRequestId',
    };

    it('should successfully validate biometrics and update electronic signature', async () => {
      const mockOrqResponse = { scanId: 'scan123' };
      const mockRedisResponse = { status: 'OK' };

      mockMsaNbCnbOrqService.startBiometricValidation.mockReturnValue(
        of(mockOrqResponse) as any,
      );
      mockMsaNbCnbOrqService.updateElectronicSign.mockResolvedValue(
        mockRedisResponse as any,
      );

      const result = await service.startBiometricValidation(validInput);

      expect(result).toEqual({ scanId: 'scan123', status: 'SUCCESS' });
      expect(
        mockMsaNbCnbOrqService.startBiometricValidation,
      ).toHaveBeenCalledTimes(1);
      expect(mockMsaNbCnbOrqService.updateElectronicSign).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should throw error if biometric validation fails', async () => {
      mockMsaNbCnbOrqService.startBiometricValidation.mockReturnValue(
        throwError(() => new Error('Orchestrator error')),
      );

      await expect(
        service.startBiometricValidation(validInput),
      ).rejects.toThrow();
    });

    it('should throw error if updating electronic signature fails', async () => {
      const mockOrqResponse = { scanId: 'scan123' };
      mockMsaNbCnbOrqService.startBiometricValidation.mockReturnValue(
        of(mockOrqResponse) as any,
      );

      // Spy on ErrorHandler.handleError and make it throw an error for this test
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Failed to update electronic signature');
      });

      mockMsaNbCnbOrqService.updateElectronicSign.mockResolvedValue(
        undefined as any,
      );

      await expect(
        service.startBiometricValidation(validInput),
      ).rejects.toThrow('Failed to update electronic signature');
    });
  });
});
