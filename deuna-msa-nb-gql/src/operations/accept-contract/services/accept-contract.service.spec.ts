import { Test, TestingModule } from '@nestjs/testing';
import { AcceptContractService } from './accept-contract.service';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { IMsaCoAuthService } from '../../../external-services/msa-co-auth/interfaces/msa-co-auth-service.interface';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { AcceptContractDataInputDto } from '../dto/accept-contract-input.dto';
import {
  GetStateOnboardingResponseDto,
  OnboardingStatusResponseDto,
} from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { of, throwError } from 'rxjs';
import { ApolloError } from 'apollo-server-express';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { Logger, LoggerService } from '@nestjs/common';
import { PreApprovedState } from '../../../common/constants/common';
import { ErrorCodes } from '../../../common/constants/error-codes';

describe('AcceptContractService', () => {
  let service: AcceptContractService;
  let msaCoOnboardingStatusService: IMsaCoOnboardingStatusService;
  let msaCoAuthService: IMsaCoAuthService;

  const mockOnboardingState: GetStateOnboardingResponseDto = {
    id: 1,
    sessionId: '123e4567-e89b-12d3-a456-426614174000',
    securitySeed: 'security-seed',
    identityId: 'identity-id',
    onbType: 'cnb',
    data: {
      startOnbCnb: {
        status: 'SUCCESS',
        data: {
          ruc: 123456789,
          message: 'Success message',
          cnbClientId: 'cnb-client-id',
        },
      },
    },
    status: 'SUCCESS',
    publicKey: 'public-key',
    createdAt: new Date(),
    updatedAt: new Date(),
    cnbClientId: 'cnb-client-id',
    enabled: true,
  };

  const mockInput: AcceptContractDataInputDto = {
    onboardingSessionId: '123e4567-e89b-12d3-a456-426614174000',
    businessDeviceId: '123e4567-e89b-12d3-a456-426614174001',
    deviceName: '123e4567-e89b-12d3-a456-426614174002',
  };

  const mockEmail = 'test@example.com';

  const mockIdentification = '1234567890';

  beforeEach(async () => {
    const mockMsaCoOnboardingStatusService = {
      getOnboardingState: jest.fn(),
      setStepAcceptContract: jest.fn(),
    };

    const mockMsaCoAuthService = {
      generateOtp: jest.fn(),
    };

    const mockMsaNbClientService = {
      getClientByIdentification: jest.fn().mockReturnValue(
        of({
          id: 'client-id-1',
          identification: '1234567890',
          remainingAttemptsOnb: 3,
        }),
      ),
      updateClientStatus: jest
        .fn()
        .mockImplementation((identification, status) => {
          expect(status).toBe(PreApprovedState.BLOCKED_PERMANENT);
          return of({
            id: 'client-id-1',
            comerceId: 'commerce-id-1',
            status: 'ACTIVE',
          });
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptContractService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: mockMsaCoOnboardingStatusService,
        },
        {
          provide: MSA_CO_AUTH_SERVICE,
          useValue: mockMsaCoAuthService,
        },
        {
          provide: MSA_NB_CLIENT_SERVICE,
          useValue: mockMsaNbClientService,
        },
      ],
    }).compile();

    service = module.get<AcceptContractService>(AcceptContractService);
    msaCoOnboardingStatusService = module.get(MSA_CO_ONBOARDING_STATE_SERVICE);
    msaCoAuthService = module.get(MSA_CO_AUTH_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateClientCnbStatus', () => {
    it('should update status to REMAINING', async () => {
      const updateClientStatusSpy = jest
        .spyOn(service['cnbClientServiceNb'], 'updateClientStatus')
        .mockReturnValue(of(null));
      await (service as any).updateClientCnbStatus('client-id', 2);
      expect(updateClientStatusSpy).toHaveBeenCalledWith({
        clientId: 'client-id',
        status: PreApprovedState.REMAINING,
        remainingAttemptsOnb: 1,
      });
    });

    it('should update status to BLOCKED_PERMANENT', async () => {
      const updateClientStatusSpy = jest
        .spyOn(service['cnbClientServiceNb'], 'updateClientStatus')
        .mockReturnValue(of(null));
      await (service as any).updateClientCnbStatus('client-id', 1);
      expect(updateClientStatusSpy).toHaveBeenCalledWith({
        clientId: 'client-id',
        status: PreApprovedState.BLOCKED_PERMANENT,
        remainingAttemptsOnb: 0,
      });
    });

    it('should handle error when updateClientStatus fails', async () => {
      jest
        .spyOn(service['cnbClientServiceNb'], 'updateClientStatus')
        .mockReturnValue(throwError(() => new Error('Update failed')));
      await expect(
        (service as any).updateClientCnbStatus('client-id', 2),
      ).rejects.toThrow(
        new ApolloError(
          '[NB_ERR_805] Error: Error updating remaining attempts client-cnb status',
          ErrorCodes.CNB_SERVICE_ERROR,
        ),
      );
    });
  });

  describe('startAcceptContract', () => {
    it('should successfully process contract acceptance', async () => {
      const mockInput: AcceptContractDataInputDto = {
        onboardingSessionId: 'test-session-id',
        businessDeviceId: 'test-device-id',
        deviceName: 'test-device-name',
      };

      const mockOnboardingState = {
        id: 1,
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-identity-id',
        onbType: 'cnb',
        data: {
          'start-onb-cnb': { status: 'SUCCESS', data: { fullName: 'Test Commerce' } },
          'confirm-data': { status: 'SUCCESS' },
          'cnb-facial': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
          'cnb-liveness': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
          'cnb-document': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
        },
        status: 'SUCCESS',
        publicKey: 'test-public-key',
        createdAt: new Date(),
        updatedAt: new Date(),
        cnbClientId: 'cnb-client-id',
        enabled: true,
      };

      const mockOtpResponse = {
        expirationDate: '2024-01-01T00:00:00Z',
        remainingResendAttempts: 3,
      };

      const mockConfirmResponse: OnboardingStatusResponseDto = {
        successSteps: ['start-onb-cnb', 'confirm-data'],
        requiredSteps: ['accept-contract'],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'cnb',
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-identity-id',
        publicKey: 'test-public-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockOnboardingState as any));

      jest
        .spyOn(msaCoAuthService, 'generateOtp')
        .mockReturnValue(of(mockOtpResponse));

      jest
        .spyOn(msaCoOnboardingStatusService, 'setStepAcceptContract')
        .mockReturnValue(of(mockConfirmResponse));
      
      jest.spyOn(service['cnbClientServiceNb'], 'getClientByIdentification').mockReturnValue(of({
        id: 'client-id',
        identification: 'test-identification',
        remainingAttemptsOnb: 3
      }))

      const result = await service.startAcceptContract(
        mockInput,
        'test@email.com',
        '1234567890',
      );

      expect(result).toEqual(
        expect.objectContaining({
          onboardingSessionId: mockInput.onboardingSessionId,
          requestId: expect.any(String),
          otpResponse: mockOtpResponse,
          status: 'SUCCESS',
        }),
      );
    });

    it('should handle null OTP response', async () => {
      const mockInput: AcceptContractDataInputDto = {
        onboardingSessionId: 'test-session-id',
        businessDeviceId: 'test-device-id',
        deviceName: 'test-device-name',
      };

      const mockOnboardingState = {
        id: 1,
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-identity-id',
        onbType: 'cnb',
        data: {
          'start-onb-cnb': { status: 'SUCCESS', data: { fullName: 'Test Commerce' } },
          'confirm-data': { status: 'SUCCESS' },
          'cnb-facial': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
          'cnb-liveness': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
          'cnb-document': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
        },
        status: 'SUCCESS',
        publicKey: 'test-public-key',
        createdAt: new Date(),
        updatedAt: new Date(),
        cnbClientId: 'cnb-client-id',
        enabled: true,
      };

      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockOnboardingState as any));
      
      jest.spyOn(service['cnbClientServiceNb'], 'getClientByIdentification').mockReturnValue(of({
        id: 'client-id',
        identification: 'test-identification',
        remainingAttemptsOnb: 3
      }))

      // Mock directly the sendOtp method to return null
      jest.spyOn(service as any, 'sendOtp').mockReturnValue(null);

      try {
        await service.startAcceptContract(
          mockInput,
          'test@email.com',
          '1234567890',
        );
      } catch (error) {
        expect(error.message).toBe(
          '[NB_ERR_905] Error: [NB_ERR_601] Error: Error sending OTP',
        );
      }
    });

    it('should handle null update onboarding state response', async () => {
      const mockInput: AcceptContractDataInputDto = {
        onboardingSessionId: 'test-session-id',
        businessDeviceId: 'test-device-id',
        deviceName: 'test-device-name',
      };

      const mockOnboardingStateData = {
        id: 1,
        sessionId: 'test-session-id',
        data: {
          'start-onb-cnb': { status: 'SUCCESS', data: { fullName: 'Test Commerce' } },
          'confirm-data': { status: 'SUCCESS' },
          'cnb-facial': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
          'cnb-liveness': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
          'cnb-document': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
        },
      };

      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockOnboardingStateData as any));
      jest.spyOn(service['cnbClientServiceNb'], 'getClientByIdentification').mockReturnValue(of({
        id: 'client-id',
        identification: 'test-identification',
        remainingAttemptsOnb: 3
      }))
      jest.spyOn(service as any, 'sendOtp').mockResolvedValue({ expirationDate: 'date', remainingResendAttempts: 2});
      jest
        .spyOn(msaCoOnboardingStatusService, 'setStepAcceptContract')
        .mockReturnValue(of(null));

      await expect(
        service.startAcceptContract(
          mockInput,
          'test@email.com',
          '1234567890',
        ),
      ).rejects.toThrow(
        new ApolloError(
          '[NB_ERR_905] Error: [NB_ERR_101] Error: Error updating onboarding state',
          ErrorCodes.ONB_STATUS_INVALID,
        ),
      );
    });

    it('should handle general error', async () => {
      const mockInput: AcceptContractDataInputDto = {
        onboardingSessionId: 'test-session-id',
        businessDeviceId: 'test-device-id',
        deviceName: 'test-device-name',
      };

      jest
        .spyOn(service as any, 'getAndValidateOnboardingState')
        .mockRejectedValue(new Error('Generic Error'));

      await expect(
        service.startAcceptContract(
          mockInput,
          'test@email.com',
          '1234567890',
        ),
      ).rejects.toThrow(
        new ApolloError(
          '[NB_ERR_905] Error: Generic Error',
          ErrorCodes.SYS_ERROR_UNKNOWN,
        ),
      );
    });

    it('should handle ApolloError', async () => {
      const mockInput: AcceptContractDataInputDto = {
        onboardingSessionId: 'test-session-id',
        businessDeviceId: 'test-device-id',
        deviceName: 'test-device-name',
      };

      const mockOnboardingState: GetStateOnboardingResponseDto = {
        id: 1,
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-identity-id',
        onbType: 'cnb',
        data: {
          startOnbCnb: {
            status: 'SUCCESS',
            data: {
              ruc: 123456789,
              message: 'Success',
              cnbClientId: 'test-client-id',
            },
          },
        },
        status: 'SUCCESS',
        publicKey: 'test-public-key',
        createdAt: new Date(),
        updatedAt: new Date(),
        cnbClientId: 'cnb-client-id',
        enabled: true,
      };

      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockOnboardingState));

      jest
        .spyOn(msaCoAuthService, 'generateOtp')
        .mockReturnValue(throwError(() => new ApolloError('OTP Error')));

      try {
        await service.startAcceptContract(
          mockInput,
          'test@email.com',
          '1234567890',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
      }
    });
  });

  describe('getAndValidateOnboardingState', () => {
    it('should throw if getOnboardingState fails', async () => {
      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(throwError(() => new Error('Get state failed')));

      await expect(
        (service as any).getAndValidateOnboardingState(
          mockInput,
          mockIdentification,
        ),
      ).rejects.toThrow(
        new ApolloError(
          '[NB_ERR_103] Error: Get state failed',
          ErrorCodes.ONB_GET_SESSION_FAIL,
        ),
      );
    });

    it('should throw if response data is missing', async () => {
      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of({ ...mockOnboardingState, data: null }));

      await expect(
        (service as any).getAndValidateOnboardingState(
          mockInput,
          mockIdentification,
        ),
      ).rejects.toThrow(
        new ApolloError(
          '[NB_ERR_104] Error: Invalid onboarding state: missing information for the session',
          ErrorCodes.ONB_DATA_INCOMPLETE,
        ),
      );
    });

    it('should throw if getClientByIdentification fails', async () => {
      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockOnboardingState));
      jest
        .spyOn(service['cnbClientServiceNb'], 'getClientByIdentification')
        .mockReturnValue(throwError(() => new Error('Get client failed')));

      await expect(
        (service as any).getAndValidateOnboardingState(
          mockInput,
          mockIdentification,
        ),
      ).rejects.toThrow(
        new ApolloError(
          '[NB_ERR_805] Error: Get client failed',
          ErrorCodes.CNB_SERVICE_ERROR,
        ),
      );
    });

    it('should throw if client not found', async () => {
      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockOnboardingState));
      jest
        .spyOn(service['cnbClientServiceNb'], 'getClientByIdentification')
        .mockReturnValue(of(null));

      await expect(
        (service as any).getAndValidateOnboardingState(
          mockInput,
          mockIdentification,
        ),
      ).rejects.toThrow(
        new ApolloError(
          '[NB_ERR_802] Error: Invalid onboarding state: cnb-client not found',
          ErrorCodes.CNB_CLIENT_NOT_FOUND,
        ),
      );
    });
  });

  describe('validateOnboardingStateErrors', () => {
    let baseMockState;

    beforeEach(() => {
      baseMockState = {
        data: {
          'start-onb-cnb': { status: 'SUCCESS', data: { fullName: 'Test Commerce' } },
          'confirm-data': { status: 'SUCCESS' },
          'cnb-facial': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
          'cnb-liveness': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
          'cnb-document': { status: 'SUCCESS', data: { statusResultValidation: 'FINALIZED_OK' } },
        },
      };
    });

    it('should not throw error if all steps are successful', () => {
      expect(() =>
        (service as any).validateOnboardingStateErrors(
          baseMockState,
          3,
          'client-id',
        ),
      ).not.toThrow();
    });

    it('should throw ONB_STATUS_INVALID if onboarding state is null', () => {
      expect(() =>
        (service as any).validateOnboardingStateErrors(null, 3, 'client-id'),
      ).toThrow(
        new ApolloError(
          '[NB_ERR_101] Error: The onboarding state is invalid',
          ErrorCodes.ONB_STATUS_INVALID,
        ),
      );
    });

    it('should throw if a required step is missing', () => {
      delete baseMockState.data['cnb-facial'];
      expect(() =>
        (service as any).validateOnboardingStateErrors(
          baseMockState,
          3,
          'client-id',
        ),
      ).toThrow(
        new ApolloError(
          `[NB_ERR_102] Error: Invalid onboarding state: the cnb-facial step has not been completed successfully`,
          ErrorCodes.ONB_STEP_INVALID,
        ),
      );
    });

    it('should throw if a required step status is not SUCCESS', () => {
      baseMockState.data['cnb-liveness'].status = 'PENDING';
      expect(() =>
        (service as any).validateOnboardingStateErrors(
          baseMockState,
          3,
          'client-id',
        ),
      ).toThrow(
        new ApolloError(
          `[NB_ERR_102] Error: Invalid onboarding state: the cnb-liveness step has not been completed successfully`,
          ErrorCodes.ONB_STEP_INVALID,
        ),
      );
    });

    it('should throw if remaining attempts are zero', () => {
      expect(() =>
        (service as any).validateOnboardingStateErrors(
          baseMockState,
          0,
          'client-id',
        ),
      ).toThrow(
        new ApolloError(
          '[NB_ERR_112] Error: Client cnb is blocked permanently, remaining attempts onboarding is 0',
          ErrorCodes.ONB_BLOCKED_PERMANENTLY,
        ),
      );
    });

    it('should throw if document validation is PENDING', () => {
      baseMockState.data['cnb-document'].data.statusResultValidation = 'PENDING';
      expect(() =>
        (service as any).validateOnboardingStateErrors(
          baseMockState,
          3,
          'client-id',
        ),
      ).toThrow(
        new ApolloError(
          '[NB_ERR_109] Error: Invalid onboarding state: the validation document step has not been completed successfully',
          ErrorCodes.ONB_VALIDATE_DOCUMENT_ID_PENDING,
        ),
      );
    });

    it('should throw if document validation fails', () => {
      const updateClientStatusSpy = jest
        .spyOn(service as any, 'updateClientCnbStatus')
        .mockResolvedValue(undefined);
      baseMockState.data['cnb-document'].data.statusResultValidation = 'FAILED';
      expect(() =>
        (service as any).validateOnboardingStateErrors(
          baseMockState,
          3,
          'client-id',
        ),
      ).toThrow(
        new ApolloError(
          '[NB_ERR_108] Error: Invalid onboarding state: the validation document step has not been completed successfully',
          ErrorCodes.ONB_VALIDATE_IDENTITY_ID_FAILED,
        ),
      );
      expect(updateClientStatusSpy).toHaveBeenCalledWith('client-id', 3);
    });

    it('should throw if facial validation fails', () => {
      const updateClientStatusSpy = jest
        .spyOn(service as any, 'updateClientCnbStatus')
        .mockResolvedValue(undefined);
      baseMockState.data['cnb-facial'].data.statusResultValidation = 'FAILED';
      expect(() =>
        (service as any).validateOnboardingStateErrors(
          baseMockState,
          3,
          'client-id',
        ),
      ).toThrow(
        new ApolloError(
          '[NB_ERR_108] Error: Invalid onboarding state: the validation facial step has not been completed successfully',
          ErrorCodes.ONB_VALIDATE_IDENTITY_ID_FAILED,
        ),
      );
      expect(updateClientStatusSpy).toHaveBeenCalledWith('client-id', 3);
    });

    it('should throw if liveness validation fails', () => {
      const updateClientStatusSpy = jest
        .spyOn(service as any, 'updateClientCnbStatus')
        .mockResolvedValue(undefined);
      baseMockState.data['cnb-liveness'].data.statusResultValidation = 'FAILED';
      expect(() =>
        (service as any).validateOnboardingStateErrors(
          baseMockState,
          3,
          'client-id',
        ),
      ).toThrow(
        new ApolloError(
          '[NB_ERR_108] Error: Invalid onboarding state: the validation identity step has not been completed successfully',
          ErrorCodes.ONB_VALIDATE_IDENTITY_ID_FAILED,
        ),
      );
      expect(updateClientStatusSpy).toHaveBeenCalledWith('client-id', 3);
    });
  });

  describe('sendOtp', () => {
    it('should generate and return OTP response', async () => {
      const mockOtpResponse = {
        expirationDate: '2024-01-01T00:00:00Z',
        remainingResendAttempts: 3,
      };

      jest
        .spyOn(msaCoAuthService, 'generateOtp')
        .mockReturnValue(of(mockOtpResponse));

      const result = await (service as any).sendOtp(
        'test-session-id',
        'test-device-id',
        'test@email.com',
      );

      expect(result).toEqual(mockOtpResponse);
    });

    it('should handle error from generateOtp and throw ApolloError', async () => {
      const error = new Error('OTP Generation Failed');
      jest.spyOn(msaCoAuthService, 'generateOtp').mockReturnValue(throwError(() => error));

      await expect(
        (service as any).sendOtp(
          'test-session-id',
          'test-device-id',
          'test@email.com',
        ),
      ).rejects.toThrow(new ApolloError('[NB_ERR_601] Error: OTP Generation Failed', ErrorCodes.NOTIF_SEND_FAILED));
    });
  });
});
