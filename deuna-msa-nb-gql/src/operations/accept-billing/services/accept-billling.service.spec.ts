import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { AcceptBillingService } from './accept-billing.service';
import { AcceptBillingInput } from '../dto/accept-billing-input.dto';
import { GetStateOnboardingResponse } from '../dto/accept-billing-response.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import {
  DataStateCnb,
  StartOnbCnb,
  StartOnbCnbData,
} from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { ApolloError } from 'apollo-server-express';

describe('AcceptBillingService', () => {
  let service: AcceptBillingService;
  let mockOnboardingService: any;

  const mockInput: AcceptBillingInput = {
    sessionId: 'test-session-id',
  };

  const mockStartOnbCnbData: StartOnbCnbData = {
    ruc: 123,
    message: 'Test',
    cnbClientId: 'test-id',
  };

  const mockStartOnbCnb: StartOnbCnb = {
    status: 'SUCCESS',
    data: mockStartOnbCnbData,
  };

  const mockDataStateCnb: DataStateCnb = {
    startOnbCnb: mockStartOnbCnb,
  };

  beforeEach(async () => {
    mockOnboardingService = {
      getOnboardingState: jest.fn(),
      updateOnboardingState: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptBillingService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: mockOnboardingService,
        },
      ],
    }).compile();

    service = module.get<AcceptBillingService>(AcceptBillingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startAcceptBilling', () => {
    describe('Success scenarios', () => {
      it('should successfully process accept billing', async () => {
        const mockInitialState: GetStateOnboardingResponse = {
          id: 1,
          sessionId: 'test-session-id',
          securitySeed: 'test-seed',
          identityId: 'test-identity-id',
          onbType: 'test-type',
          data: mockDataStateCnb,
          publicKey: 'test-key',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockOnboardingService.getOnboardingState.mockReturnValue(
          of(mockInitialState),
        );

        const mockUpdateResponse = {
          successSteps: ['accept-billing'],
          requiredSteps: [],
          optionalSteps: [],
          failureSteps: [],
          successIdentityValidationSteps: [],
          standbyIdentityValidationSteps: [],
          processingFailure: [],
          status: 'SUCCESS',
          onbType: 'cnb',
        };

        mockOnboardingService.updateOnboardingState.mockReturnValue(
          of(mockUpdateResponse),
        );

        const result = await service.startAcceptBilling(mockInput);

        expect(result).toEqual({
          sessionId: mockInput.sessionId,
          status: 'SUCCESS',
        });
      });
    });

    describe('Validation scenarios', () => {
      it('should handle null onboarding state', async () => {
        mockOnboardingService.getOnboardingState.mockReturnValue(of(null));

        await expect(service.startAcceptBilling(mockInput)).rejects.toThrow(
          ApolloError,
        );
      });

      it('should handle when accept-billing state exists', async () => {
        const stateWithBilling: GetStateOnboardingResponse = {
          id: 1,
          sessionId: 'test-session-id',
          securitySeed: 'test-seed',
          identityId: 'test-identity-id',
          onbType: 'test-type',
          data: {
            startOnbCnb: mockStartOnbCnb,
            acceptBilling: { status: 'SUCCESS' } as any,
          } as DataStateCnb,
          publicKey: 'test-key',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockOnboardingService.getOnboardingState.mockReturnValue(
          of(stateWithBilling),
        );

        await expect(service.startAcceptBilling(mockInput)).rejects.toThrow(
          ApolloError,
        );
      });

      it('should handle null updateOnboardingState response', async () => {
        const mockInitialState: GetStateOnboardingResponse = {
          id: 1,
          sessionId: 'test-session-id',
          securitySeed: 'test-seed',
          identityId: 'test-identity-id',
          onbType: 'test-type',
          data: mockDataStateCnb,
          publicKey: 'test-key',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockOnboardingService.getOnboardingState.mockReturnValue(
          of(mockInitialState),
        );
        mockOnboardingService.updateOnboardingState.mockReturnValue(of(null));

        await expect(service.startAcceptBilling(mockInput)).rejects.toThrow(
          ApolloError,
        );
      });
    });

    describe('Error handling scenarios', () => {
      it('should handle timeout errors', async () => {
        mockOnboardingService.getOnboardingState.mockReturnValue(
          throwError(() => new Error('timeout')),
        );

        await expect(service.startAcceptBilling(mockInput)).rejects.toThrow(
          ApolloError,
        );
      });

      it('should handle network errors', async () => {
        mockOnboardingService.getOnboardingState.mockReturnValue(
          throwError(() => new Error('network')),
        );

        await expect(service.startAcceptBilling(mockInput)).rejects.toThrow(
          ApolloError,
        );
      });

      it('should handle unknown errors', async () => {
        mockOnboardingService.getOnboardingState.mockReturnValue(
          throwError(() => new Error('unknown error')),
        );

        await expect(service.startAcceptBilling(mockInput)).rejects.toThrow(
          ApolloError,
        );
      });
    });
  });

  describe('validateStateOnboarding', () => {
    it('should return false for invalid states', () => {
      expect(service['validateStateOnboarding'](null)).toBe(false);
      expect(service['validateStateOnboarding'](undefined)).toBe(false);
      expect(
        service['validateStateOnboarding']({} as GetStateOnboardingResponse),
      ).toBe(false);
      expect(
        service['validateStateOnboarding']({
          data: null,
        } as GetStateOnboardingResponse),
      ).toBe(false);
      expect(
        service['validateStateOnboarding']({ data: 'not-an-object' } as any),
      ).toBe(false);
    });

    it('should return false for valid state without accept-billing', () => {
      const validState: GetStateOnboardingResponse = {
        id: 1,
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-identity-id',
        onbType: 'test-type',
        data: mockDataStateCnb,
        publicKey: 'test-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service['validateStateOnboarding'](validState)).toBe(false);
    });
  });
});
