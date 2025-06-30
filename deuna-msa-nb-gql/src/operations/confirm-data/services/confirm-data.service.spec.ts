import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { ConfirmDataService } from './confirm-data.service';
import { ConfirmDataInputDto } from '../dto/confirm-data-input.dto';
import { GetStateOnboardingResponseDto } from '../dto/confirm-data-response.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_NB_CONFIGURATION_SERVICE } from '../../../external-services/msa-nb-configuration/providers/msa-nb-configuration-provider';
import { ApolloError } from 'apollo-server-express';

jest.setTimeout(10000);

describe('ConfirmDataService', () => {
  let service: ConfirmDataService;
  let mockOnboardingService: any;
  let mockConfigurationService: any;

  beforeEach(async () => {
    mockOnboardingService = {
      getOnboardingState: jest.fn(),
      updateOnboardingState: jest.fn(),
    };
    mockConfigurationService = {
      saveDataConfiguration: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmDataService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: mockOnboardingService,
        },
        {
          provide: MSA_NB_CONFIGURATION_SERVICE,
          useValue: mockConfigurationService,
        },
      ],
    }).compile();

    service = module.get<ConfirmDataService>(ConfirmDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startConfirmData', () => {
    const mockInput: ConfirmDataInputDto = {
      sessionId: 'test-session-id',
      establishment: {
        fullAddress: 'test-full-address',
        numberEstablishment: 'test-number-establishment',
      },
    };

    const mockOnboardingStateResponse: GetStateOnboardingResponseDto = {
      id: 1,
      sessionId: 'test-session-id',
      securitySeed: 'test-seed',
      identityId: 'test-identity-id',
      onbType: 'test-type',
      data: {
        startOnbCnb: {
          status: 'SUCCESS',
          data: { ruc: 123, message: 'Test', cnbClientId: 'test-id' },
        },
      },
      status: 'IN_PROGRESS',
      publicKey: 'test-public-key',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw ApolloError if onboarding state is invalid', async () => {
      const invalidStateResponse = {
        ...mockOnboardingStateResponse,
        data: { invalidKey: {} },
      };
      mockOnboardingService.getOnboardingState.mockReturnValue(
        of(invalidStateResponse),
      );

      await expect(service.startConfirmData(mockInput)).rejects.toThrow(
        ApolloError,
      );
    });

    it('should handle error', (done) => {
      const errorMessage = 'Test error';
      const someObservable = throwError(new Error(errorMessage));

      someObservable.subscribe(
        () => {
          done.fail('Expected an error but got a success');
        },
        (error) => {
          expect(error).toBeDefined();
          expect(error.message).toBe(errorMessage);
          done();
        },
      );
    });

    it('should handle errors from saveDataConfiguration', async () => {
      mockOnboardingService.getOnboardingState.mockReturnValue(
        of(mockOnboardingStateResponse),
      );
      mockConfigurationService.saveDataConfiguration.mockReturnValue(
        throwError(() => new Error('No se pudo encontrar el usuario')),
      );

      await expect(service.startConfirmData(mockInput)).rejects.toThrow(
        ApolloError,
      );
    }, 10000);

    it('should handle errors from updateOnboardingState', async () => {
      mockOnboardingService.getOnboardingState.mockReturnValue(
        of(mockOnboardingStateResponse),
      );
      mockConfigurationService.saveDataConfiguration.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(
        throwError(() => new Error('No se pudo encontrar el usuario')),
      );

      await expect(service.startConfirmData(mockInput)).rejects.toThrow(
        ApolloError,
      );
    }, 10000);
  });
});
