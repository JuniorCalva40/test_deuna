import { Test, TestingModule } from '@nestjs/testing';
import { FakeMsaCoOnboardingStatusService } from './mock-msa-co-onboarding-status.service';
import { UpdateDataOnboardingInputDto } from '../dto/msa-co-onboarding-status-input.dto';
import { firstValueFrom, lastValueFrom } from 'rxjs';

describe('FakeMsaCoOnboardingStatusService', () => {
  let service: FakeMsaCoOnboardingStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FakeMsaCoOnboardingStatusService],
    }).compile();

    service = module.get<FakeMsaCoOnboardingStatusService>(
      FakeMsaCoOnboardingStatusService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOnboardingState', () => {
    it('should return an observable with mocked data', async () => {
      const sessionId = '597c42af-6516-48b8-9eee-9c2de3b3e549';
      const result = await firstValueFrom(
        service.getOnboardingState(sessionId),
      );

      expect(result).toEqual(
        expect.objectContaining({
          sessionId: '597c42af-6516-48b8-9eee-9c2de3b3e549',
          identityId: '1728839940',
          onbType: 'cnb',
          status: 'IN_PROGRESS',
        }),
      );
    });

    it('should throw an error if sessionId is not provided', () => {
      expect(() => service.getOnboardingState('')).toThrow(
        'sessionId is required',
      );
    });
  });

  describe('updateOnboardingState', () => {
    it('should return an observable with mocked data', async () => {
      const input: UpdateDataOnboardingInputDto = {
        sessionId: 'test-session',
        status: 'SUCCESS',
        data: {},
      };
      const result = await firstValueFrom(service.updateOnboardingState(input));

      expect(result).toEqual(
        expect.objectContaining({
          successSteps: ['start-onb-cnb', 'confirm-data'],
          requiredSteps: ['accept-billing', 'accept-contract', 'sign-contract'],
          status: 'IN_PROGRESS',
          onbType: 'cnb',
        }),
      );
    });

    it('should throw an error if input is not provided', () => {
      expect(() => service.updateOnboardingState(null)).toThrow(
        'input data is required',
      );
    });
  });

  describe('initOnboarding', () => {
    it('should throw an error with "Method not implemented"', () => {
      const input = {
        identityId: 'test-id',
        onbType: 'test-type',
        securitySeed: 'test-seed',
        publicKey: 'test-key',
      };
      expect(() => service.initOnboarding(input)).toThrow(
        'Method not implemented.',
      );
    });
  });

  describe('getClientDataFromStartOnboardingState', () => {
    it('should throw an error with "Method not implemented"', () => {
      expect(() => service.getClientDataFromStartOnboardingState()).toThrow(
        'Method not implemented.',
      );
    });
  });
});

describe('FakeMsaCoOnboardingStatusService', () => {
  let service: FakeMsaCoOnboardingStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FakeMsaCoOnboardingStatusService],
    }).compile();

    service = module.get<FakeMsaCoOnboardingStatusService>(
      FakeMsaCoOnboardingStatusService,
    );
  });

  describe('getOtpDataFromValidateOtpState', () => {
    it('should throw error if sessionId is not provided', () => {
      expect(() => service.getOtpDataFromValidateOtpState('')).toThrow(
        'sessionId is required',
      );
    });

    it('should return mock OTP data', async () => {
      const sessionId = 'test-session-id';
      const result = await lastValueFrom(
        service.getOtpDataFromValidateOtpState(sessionId),
      );

      expect(result).toBeDefined();
      expect(result.otp).toBeDefined();
      expect(result.otp).toBe('123456');
    });
  });

  describe('completeOnboarding', () => {
    it('should throw error if sessionId is not provided', () => {
      expect(() => service.completeOnboarding('')).toThrow(
        'sessionId is required',
      );
    });

    it('should return successful completion response', async () => {
      const sessionId = 'test-session-id';
      const result = await lastValueFrom(service.completeOnboarding(sessionId));

      expect(result).toEqual({
        status: 'SUCCESS',
      });
    });
  });

  describe('setStepValidateOtp', () => {
    it('debe lanzar un error si sessionId o otp no se proporcionan', () => {
      expect(() => service.setStepValidateOtp('', '')).toThrow(
        'sessionId and otp are required',
      );
      expect(() => service.setStepValidateOtp('test-session', '')).toThrow(
        'sessionId and otp are required',
      );
      expect(() => service.setStepValidateOtp('', 'test-otp')).toThrow(
        'sessionId and otp are required',
      );
    });

    it('debe devolver un observable con datos simulados', async () => {
      const sessionId = 'test-session-id';
      const otp = 'test-otp';
      const result = await lastValueFrom(
        service.setStepValidateOtp(sessionId, otp),
      );

      expect(result).toEqual({
        status: 'SUCCESS',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        onbType: '',
      });
    });
  });
});
