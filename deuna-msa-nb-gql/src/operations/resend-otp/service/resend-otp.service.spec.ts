import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { ResendOtpService } from './resend-otp.service';
import { ResendOtpInput } from '../dto/resend-otp.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { ApolloError } from 'apollo-server-express';

jest.mock('../../../utils/error-handler.util', () => ({
  ErrorHandler: {
    handleError: jest.fn().mockImplementation((message) => {
      throw new ApolloError(message);
    }),
  },
}));

describe('ResendOtpService', () => {
  let service: ResendOtpService;
  let mockOnboardingStatusService: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockOnboardingStatusService = {
      getOnboardingState: jest.fn(),
    };
    mockAuthService = {
      generateOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendOtpService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: mockOnboardingStatusService,
        },
        {
          provide: MSA_CO_AUTH_SERVICE,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<ResendOtpService>(ResendOtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resendOtp', () => {
    const mockInput: ResendOtpInput = { sessionId: 'test-session-id' };

    it('should successfully resend OTP', async () => {
      const mockOnboardingState = {
        data: {
          'accept-contract': {
            status: 'SUCCESS',
            businessDeviceId: 'test-device-id',
            deviceName: 'Test Device',
            commerceName: 'Test Company',
            email: 'test@example.com',
            requestId: 'test-request-id',
            notificationChannel: ['email'],
          },
          'start-onb-cnb': {},
          'validate-identity': {},
          'validate-email': {},
        },
      };
      const mockOtpResponse = {
        expirationDate: '2023-05-01T12:00:00Z',
        remainingResendAttempts: 2,
      };

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        of(mockOnboardingState),
      );
      mockAuthService.generateOtp.mockReturnValue(of(mockOtpResponse));

      const result = await service.resendOtp(mockInput);

      expect(result.message).toBe('OTP resent successfully');
      expect(result.expirationDate).toBe(mockOtpResponse.expirationDate);
      expect(result.remainingResendAttempts).toBe(
        mockOtpResponse.remainingResendAttempts,
      );
      expect(result.status).toBe('SUCCESS');
    });

    it('should handle invalid sessionId', async () => {
      mockOnboardingStatusService.getOnboardingState.mockReturnValue(of(null));

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow('NB_ERR_103');
    });

    it('should handle incorrect onboarding state', async () => {
      const mockOnboardingState = {
        data: {
          'accept-contract': { status: 'PENDING' },
          'start-onb-cnb': {},
          'validate-identity': {},
        },
      };

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        of(mockOnboardingState),
      );

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow('NB_ERR_101');
    });

    it('should handle OTP generation error', async () => {
      const mockOnboardingState = {
        data: {
          'accept-contract': {
            status: 'SUCCESS',
            businessDeviceId: 'test-device-id',
            deviceName: 'Test Device',
            commerceName: 'Test Company',
            email: 'test@example.com',
            requestId: 'test-request-id',
            notificationChannel: ['email'],
          },
          'start-onb-cnb': {},
          'validate-identity': {},
          'validate-email': {},
        },
      };

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        of(mockOnboardingState),
      );
      mockAuthService.generateOtp.mockReturnValue(
        throwError(() => new Error('OTP generation failed')),
      );

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow(
        'Error: OTP generation failed',
      );
    });

    it('should handle OTP generation failure', async () => {
      const mockOnboardingState = {
        data: {
          'accept-contract': {
            status: 'SUCCESS',
            businessDeviceId: 'test-device-id',
            deviceName: 'Test Device',
            commerceName: 'Test Company',
            email: 'test@example.com',
            requestId: 'test-request-id',
            notificationChannel: ['email'],
          },
          'start-onb-cnb': {},
          'validate-identity': {},
          'validate-email': {},
        },
      };

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        of(mockOnboardingState),
      );
      mockAuthService.generateOtp.mockReturnValue(of(null));

      const expectedError = new Error('NB_ERR_003') as any;
      expectedError.code = 'AUTH_OTP_INVALID';

      await expect(service.resendOtp(mockInput)).rejects.toThrowError(
        expectedError,
      );
    });

    it('should handle known errors', async () => {
      const mockError = new Error('Known error');

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        throwError(() => mockError),
      );

      const expectedError = new Error('Error: Known error') as any;
      expectedError.code = 'Known error';

      await expect(service.resendOtp(mockInput)).rejects.toThrowError(
        expectedError,
      );
    });

    it('should handle unknown errors', async () => {
      const mockError = { message: 'Unknown error' };

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        throwError(() => mockError),
      );

      const expectedError = new Error('NB_ERR_905') as any;
      expectedError.code = 'SYS_ERROR_UNKNOWN';

      await expect(service.resendOtp(mockInput)).rejects.toThrowError(
        expectedError,
      );
    });
  });
});
