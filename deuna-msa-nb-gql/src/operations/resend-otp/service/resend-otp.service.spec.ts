import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { ResendOtpService } from './resend-otp.service';
import { ResendOtpInput } from '../dto/resend-otp.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { ApolloError } from 'apollo-server-express';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { PreApprovedState } from '../../../common/constants/common';

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
  let mockNbClientService: any;
  let mockInput: ResendOtpInput;
  let mockCurrentDate: Date;

  beforeEach(async () => {
    mockCurrentDate = new Date('2024-01-01T12:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);

    mockInput = {
      onboardingSessionId: 'test-session-id',
    };

    mockOnboardingStatusService = {
      getOnboardingState: jest.fn(),
      getClientDataFromStartOnboardingState: jest.fn(),
    };
    mockAuthService = {
      generateOtp: jest.fn(),
    };
    mockNbClientService = {
      updateClientStatus: jest.fn().mockReturnValue(of({})),
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
        {
          provide: MSA_NB_CLIENT_SERVICE,
          useValue: mockNbClientService,
        },
      ],
    }).compile();

    service = module.get<ResendOtpService>(ResendOtpService);

    jest.clearAllMocks();
    // Mock del ErrorHandler para asegurar que los códigos de error se propaguen correctamente
    jest
      .spyOn(ErrorHandler, 'handleError')
      .mockImplementation((message, code) => {
        const error = new ApolloError(message, code, {
          errorResponse: {
            status: 'ERROR',
            errors: [
              {
                code: code,
                message: message,
                context: 'resend-otp',
              },
            ],
          },
        });
        error.extensions.code = code; // Aseguramos que el código se establezca correctamente
        throw error;
      });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resendOtp', () => {
    const mockClientInfo = {
      cnbClientId: 'test-client-id',
      status: 'ACTIVE',
    };

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
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );

      const result = await service.resendOtp(mockInput);

      expect(result.message).toBe('OTP resent successfully');
      expect(result.expirationDate).toBe(mockOtpResponse.expirationDate);
      expect(result.remainingResendAttempts).toBe(
        mockOtpResponse.remainingResendAttempts,
      );
      expect(result.status).toBe('SUCCESS');
    });

    it('should handle invalid sessionId', async () => {
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );
      mockOnboardingStatusService.getOnboardingState.mockReturnValue(of(null));

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow('NB_ERR_103');
    });

    it('should handle incorrect onboarding state', async () => {
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );
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
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );
      const mockOnboardingState = {
        data: {
          'accept-contract': {
            status: 'SUCCESS',
            businessDeviceId: 'test-device-id',
            deviceName: 'Test Device',
            commerceName: 'Test Company',
            email: 'test@example.com',
            requestId: 'test-request-id',
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
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );
      const mockOnboardingState = {
        data: {
          'accept-contract': {
            status: 'SUCCESS',
            businessDeviceId: 'test-device-id',
            deviceName: 'Test Device',
            commerceName: 'Test Company',
            email: 'test@example.com',
            requestId: 'test-request-id',
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

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow('NB_ERR_003');
    });

    it('should handle known errors', async () => {
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );
      const mockError = new Error('Known error');
      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        throwError(() => mockError),
      );

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow(
        'Error: Known error',
      );
    });

    it('should handle unknown errors', async () => {
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );
      const mockError = { message: 'Unknown error' };
      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        throwError(() => mockError),
      );

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow('NB_ERR_905');
    });

    it('should handle client blocked by OTP', async () => {
      const blockedClientInfo = {
        cnbClientId: 'test-client-id',
        status: PreApprovedState.BLOCKED_TMP,
      };

      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(blockedClientInfo),
      );

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow(
        'Client is temporarily blocked by the OTP',
      );
    });

    it('should update client status when remaining attempts reach zero', async () => {
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );

      const mockOnboardingState = {
        data: {
          'accept-contract': {
            status: 'SUCCESS',
            businessDeviceId: 'test-device-id',
            deviceName: 'Test Device',
            commerceName: 'Test Company',
            email: 'test@example.com',
            requestId: 'test-request-id',
          },
          'start-onb-cnb': {},
          'validate-identity': {},
          'validate-email': {},
        },
      };

      const mockOtpResponse = {
        expirationDate: '2023-05-01T12:00:00Z',
        remainingResendAttempts: 0,
      };

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        of(mockOnboardingState),
      );
      mockAuthService.generateOtp.mockReturnValue(of(mockOtpResponse));

      const result = await service.resendOtp(mockInput);

      expect(result.remainingResendAttempts).toBe(0);
      expect(mockNbClientService.updateClientStatus).toHaveBeenCalledWith({
        clientId: mockClientInfo.cnbClientId,
        status: PreApprovedState.BLOCKED_TMP,
      });
    });

    it('should handle missing required fields in accept contract data', async () => {
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );

      const mockOnboardingState = {
        data: {
          'accept-contract': {
            status: 'SUCCESS',
            // Faltan campos requeridos
            businessDeviceId: '',
            deviceName: '',
            commerceName: '',
            email: '',
            requestId: '',
          },
          'start-onb-cnb': {},
          'validate-identity': {},
          'validate-email': {},
        },
      };

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        of(mockOnboardingState),
      );

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow('NB_ERR_104');
    });

    it('should handle onboarding state with missing data structure', async () => {
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of({ cnbClientId: 'test-id', status: 'ACTIVE' }),
      );

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        throwError(() => new Error('Invalid onboarding state structure')),
      );

      await expect(async () => {
        await service.resendOtp(mockInput);
      }).rejects.toThrowError();
    });

    it('should handle error when updating client status', async () => {
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientInfo),
      );

      const mockOnboardingState = {
        data: {
          'accept-contract': {
            status: 'SUCCESS',
            businessDeviceId: 'test-device-id',
            deviceName: 'Test Device',
            commerceName: 'Test Company',
            email: 'test@example.com',
            requestId: 'test-request-id',
          },
          'start-onb-cnb': {},
          'validate-identity': {},
          'validate-email': {},
        },
      };

      const mockOtpResponse = {
        expirationDate: '2023-05-01T12:00:00Z',
        remainingResendAttempts: 0,
      };

      mockOnboardingStatusService.getOnboardingState.mockReturnValue(
        of(mockOnboardingState),
      );
      mockAuthService.generateOtp.mockReturnValue(of(mockOtpResponse));
      mockNbClientService.updateClientStatus.mockReturnValue(
        throwError(() => new Error('Failed to update client status')),
      );

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);
      await expect(service.resendOtp(mockInput)).rejects.toThrow(
        'Error: Failed to update client status',
      );
    });

    it('should handle blocked client', async () => {
      const blockStartTime = new Date('2024-01-01T09:00:00Z'); // 3 horas antes
      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of({
          cnbClientId: 'test-id',
          status: 'BLOCKED_TMP',
          blockStartTime: blockStartTime.toISOString(),
        }),
      );

      await expect(async () => {
        await service.resendOtp(mockInput);
      }).rejects.toThrowError();
    });
  });

  describe('validateClientStatus', () => {
    it('should handle invalid blockStartTime format', async () => {
      const mockBlockedClient = {
        cnbClientId: 'test-client-id',
        status: PreApprovedState.BLOCKED_TMP,
        blockStartTime: 'invalid-date',
      };

      mockOnboardingStatusService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockBlockedClient),
      );

      await expect(service.resendOtp(mockInput)).rejects.toThrow(ApolloError);

      await expect(service.resendOtp(mockInput)).rejects.toThrow(
        'Client is temporarily blocked by the OTP',
      );
    });
  });
});
