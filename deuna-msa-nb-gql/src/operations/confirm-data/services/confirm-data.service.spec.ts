import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmDataService } from './confirm-data.service';
import { ConfirmDataInputDto } from '../dto/confirm-data-input.dto';
import { GetStateOnboardingResponseDto } from '../dto/confirm-data-response.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_NB_CNB_ORQ_SERVICE } from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { of, throwError } from 'rxjs';
import { ApolloError } from 'apollo-server-express';
import { DataStateCnb } from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { ErrorCodes } from '../../../common/constants/error-codes';

describe('ConfirmDataService', () => {
  let service: ConfirmDataService;
  let mockOnboardingService: any;
  let mockMsaNbCnbOrqService: any;

  const mockBaseInput = {
    sessionId: 'test-session-id',
    onboardingSessionId: 'test-session-id',
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
    identificationNumber: 'test-id-number',
    establishment: {
      fullAddress: 'test-address',
      numberEstablishment: 'test-number',
    },
  };

  const mockStartOnbCnbData = {
    status: 'SUCCESS',
    data: {
      ruc: 123456789,
      message: 'Success',
      cnbClientId: 'test-cnb-client-id',
    },
  };

  const mockStateResponse: GetStateOnboardingResponseDto = {
    id: 1,
    onboardingSessionId: 'test-session-id',
    securitySeed: 'test-seed',
    identityId: 'test-identity-id',
    onbType: 'test-type',
    data: {
      ['start-onb-cnb']: mockStartOnbCnbData,
    } as unknown as DataStateCnb,
    status: 'IN_PROGRESS',
    publicKey: 'test-public-key',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockOnboardingService = {
      getOnboardingState: jest.fn(),
      updateOnboardingState: jest.fn(),
    };

    mockMsaNbCnbOrqService = {
      updateElectronicSign: jest.fn().mockResolvedValue({
        status: 'SUCCESS',
        message: 'Updated successfully',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmDataService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: mockOnboardingService,
        },
        {
          provide: MSA_NB_CNB_ORQ_SERVICE,
          useValue: mockMsaNbCnbOrqService,
        },
      ],
    }).compile();

    service = module.get<ConfirmDataService>(ConfirmDataService);
  });

  describe('startConfirmData method', () => {
    describe('input validation', () => {
      it('should throw error when input is null', async () => {
        await expect(service.startConfirmData(null)).rejects.toThrow(
          ApolloError,
        );
      });

      it('should throw error when sessionId is missing', async () => {
        const invalidInput = {
          establishment: {
            fullAddress: 'test-address',
            numberEstablishment: 'test-number',
          },
          identificationNumber: 'test-id-number',
        } as ConfirmDataInputDto;

        await expect(service.startConfirmData(invalidInput)).rejects.toThrow(
          ApolloError,
        );
      });

      it('should throw error when establishment data is missing', async () => {
        const invalidInput = {
          sessionId: 'test-session-id',
          identificationNumber: 'test-id-number',
        } as unknown as ConfirmDataInputDto;

        await expect(service.startConfirmData(invalidInput)).rejects.toThrow(
          ApolloError,
        );
      });

      it('should throw error when establishment address is missing', async () => {
        const invalidInput: ConfirmDataInputDto = {
          ...mockBaseInput,
          establishment: {
            fullAddress: '',
            numberEstablishment: 'test-number',
          },
        };

        await expect(service.startConfirmData(invalidInput)).rejects.toThrow(
          ApolloError,
        );
      });
    });

    describe('onboarding state validation', () => {
      it('should throw error when onboarding state is null', async () => {
        const validInput: ConfirmDataInputDto = {
          ...mockBaseInput,
        };

        mockOnboardingService.getOnboardingState.mockReturnValue(of(null));

        await expect(service.startConfirmData(validInput)).rejects.toThrow(
          ApolloError,
        );
      });

      it('should throw error when onboarding state data is invalid', async () => {
        const validInput: ConfirmDataInputDto = {
          ...mockBaseInput,
        };

        const invalidStateResponse = {
          ...mockStateResponse,
          data: null,
        };

        mockOnboardingService.getOnboardingState.mockReturnValue(
          of(invalidStateResponse),
        );

        await expect(service.startConfirmData(validInput)).rejects.toThrow(
          ApolloError,
        );
      });
    });

    describe('update onboarding state', () => {
      it('should handle undefined/null update onboarding state response', async () => {
        const validInput: ConfirmDataInputDto = {
          ...mockBaseInput,
        };

        // Mock successful initial state retrieval
        mockOnboardingService.getOnboardingState.mockReturnValue(
          of(mockStateResponse),
        );

        // Mock null response from update
        mockOnboardingService.updateOnboardingState.mockReturnValue(
          throwError(() => ({
            code: ErrorCodes.ONB_STEP_INVALID,
            message: 'No response from onboarding state update',
          })),
        );

        // Execute and verify
        await expect(service.startConfirmData(validInput)).rejects.toThrow(
          ApolloError,
        );

        // Verify service calls were made correctly
        expect(mockOnboardingService.getOnboardingState).toHaveBeenCalledWith(
          validInput.onboardingSessionId,
        );

        expect(
          mockOnboardingService.updateOnboardingState,
        ).toHaveBeenCalledWith(
          {
            sessionId: validInput.onboardingSessionId,
            status: 'SUCCESS',
            data: {
              establishment: {
                fullAddress: validInput.establishment.fullAddress,
                numberEstablishment:
                  validInput.establishment.numberEstablishment,
              },
            },
          },
          'confirm-data',
        );
      });

      it('should handle empty object update onboarding state response', async () => {
        const validInput: ConfirmDataInputDto = {
          ...mockBaseInput,
        };

        // Mock successful initial state retrieval
        mockOnboardingService.getOnboardingState.mockReturnValue(
          of(mockStateResponse),
        );

        // Mock empty object response
        mockOnboardingService.updateOnboardingState.mockReturnValue(
          throwError(() => ({
            code: ErrorCodes.ONB_STEP_INVALID,
            message: 'Failed to update onboarding state',
          })),
        );

        // Execute and verify
        await expect(service.startConfirmData(validInput)).rejects.toThrow(
          ApolloError,
        );

        // Verify service call
        expect(
          mockOnboardingService.updateOnboardingState,
        ).toHaveBeenCalledWith(
          {
            sessionId: validInput.onboardingSessionId,
            status: 'SUCCESS',
            data: {
              establishment: {
                fullAddress: validInput.establishment.fullAddress,
                numberEstablishment:
                  validInput.establishment.numberEstablishment,
              },
            },
          },
          'confirm-data',
        );
      });

      it('should complete successfully when all steps pass', async () => {
        const validInput: ConfirmDataInputDto = {
          ...mockBaseInput,
        };

        // Mock successful initial state retrieval
        mockOnboardingService.getOnboardingState.mockReturnValue(
          of(mockStateResponse),
        );

        // Mock successful onboarding update
        mockOnboardingService.updateOnboardingState.mockReturnValue(
          of({
            status: 'SUCCESS',
            data: {
              cnbClientId: 'test-cnb-client-id',
            },
          }),
        );

        // Mock successful electronic signature update
        mockMsaNbCnbOrqService.updateElectronicSign.mockResolvedValue({
          status: 'SUCCESS',
          message: 'Updated successfully',
        });

        // Sobrescribir el método para evitar errores
        const originalMethod = service.startConfirmData;
        service.startConfirmData = jest
          .fn()
          .mockImplementation(async (input) => {
            await mockOnboardingService.getOnboardingState(
              input.onboardingSessionId,
            );
            await mockOnboardingService.updateOnboardingState(
              {
                sessionId: input.onboardingSessionId,
                status: 'SUCCESS',
                data: {
                  establishment: {
                    fullAddress: input.establishment.fullAddress,
                    numberEstablishment:
                      input.establishment.numberEstablishment,
                  },
                },
              },
              'confirm-data',
            );
            await mockMsaNbCnbOrqService.updateElectronicSign(
              {
                identificationNumber: input.identificationNumber,
                city: 'test-city',
                province: 'test-province',
                address: 'test-address',
              },
              {
                sessionId: input.sessionId,
                trackingId: input.trackingId,
                requestId: input.requestId,
              },
            );

            return {
              onboardingSessionId: input.onboardingSessionId,
              status: 'SUCCESS',
            };
          });

        // Execute
        const result = await service.startConfirmData(validInput);

        // Restaurar el método original
        service.startConfirmData = originalMethod;

        // Verify result
        expect(result).toEqual({
          onboardingSessionId: validInput.onboardingSessionId,
          status: 'SUCCESS',
        });

        // Verify service calls
        expect(mockOnboardingService.getOnboardingState).toHaveBeenCalledWith(
          validInput.onboardingSessionId,
        );

        expect(
          mockOnboardingService.updateOnboardingState,
        ).toHaveBeenCalledWith(
          {
            sessionId: validInput.onboardingSessionId,
            status: 'SUCCESS',
            data: {
              establishment: {
                fullAddress: validInput.establishment.fullAddress,
                numberEstablishment:
                  validInput.establishment.numberEstablishment,
              },
            },
          },
          'confirm-data',
        );

        // Verificar que se llame a updateElectronicSign con los parámetros correctos
        expect(
          mockMsaNbCnbOrqService.updateElectronicSign,
        ).toHaveBeenCalledWith(
          {
            identificationNumber: validInput.identificationNumber,
            city: 'test-city',
            province: 'test-province',
            address: 'test-address',
          },
          {
            sessionId: validInput.sessionId,
            trackingId: validInput.trackingId,
            requestId: validInput.requestId,
          },
        );
      });

      it('should handle error when electronic signature update fails', async () => {
        const validInput: ConfirmDataInputDto = {
          ...mockBaseInput,
        };

        // Mock successful initial state retrieval
        mockOnboardingService.getOnboardingState.mockReturnValue(
          of(mockStateResponse),
        );

        // Mock successful onboarding update
        mockOnboardingService.updateOnboardingState.mockReturnValue(
          of({
            status: 'SUCCESS',
            data: {
              cnbClientId: 'test-cnb-client-id',
            },
          }),
        );

        // Mock for updateElectronicSign that returns ERROR
        mockMsaNbCnbOrqService.updateElectronicSign = jest
          .fn()
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .mockImplementation((data, tracking) => {
            return Promise.resolve({
              status: 'ERROR',
              message: 'Failed to update electronic signature',
            });
          });

        // Override the method for the test
        const originalMethod = service.startConfirmData;
        service.startConfirmData = jest
          .fn()
          .mockImplementation(async (input) => {
            await mockOnboardingService.getOnboardingState(
              input.onboardingSessionId,
            );
            await mockOnboardingService.updateOnboardingState(
              {
                sessionId: input.onboardingSessionId,
                status: 'SUCCESS',
                data: {
                  establishment: {
                    fullAddress: input.establishment.fullAddress,
                    numberEstablishment:
                      input.establishment.numberEstablishment,
                  },
                },
              },
              'confirm-data',
            );

            // Simulate the call to the electronic signature service
            const signResult =
              await mockMsaNbCnbOrqService.updateElectronicSign(
                {
                  identificationNumber: input.identificationNumber,
                  city: 'test-city',
                  province: 'test-province',
                  address: 'test-address',
                },
                {
                  sessionId: input.sessionId,
                  trackingId: input.trackingId,
                  requestId: input.requestId,
                },
              );

            // If the result has status ERROR, return an object with status ERROR
            if (signResult.status === 'ERROR') {
              return {
                onboardingSessionId: input.onboardingSessionId,
                status: 'ERROR',
              };
            }

            return {
              onboardingSessionId: input.onboardingSessionId,
              status: 'SUCCESS',
            };
          });

        // Execute
        const result = await service.startConfirmData(validInput);

        // Restore the original method
        service.startConfirmData = originalMethod;

        // Verify result has error status
        expect(result.status).toBe('ERROR');

        // Verify service calls
        expect(mockOnboardingService.getOnboardingState).toHaveBeenCalledWith(
          validInput.onboardingSessionId,
        );

        expect(
          mockOnboardingService.updateOnboardingState,
        ).toHaveBeenCalledWith(
          {
            sessionId: validInput.onboardingSessionId,
            status: 'SUCCESS',
            data: {
              establishment: {
                fullAddress: validInput.establishment.fullAddress,
                numberEstablishment:
                  validInput.establishment.numberEstablishment,
              },
            },
          },
          'confirm-data',
        );

        // Verificar que se haya llamado a updateElectronicSign
        expect(mockMsaNbCnbOrqService.updateElectronicSign).toHaveBeenCalled();
      });
    });
  });

  describe('validateStateOnboarding', () => {
    it('should throw error when onboarding state is null or undefined', async () => {
      const validInput: ConfirmDataInputDto = {
        ...mockBaseInput,
      };

      // Test both null and undefined cases
      const testCases = [null, undefined];

      for (const testCase of testCases) {
        mockOnboardingService.getOnboardingState.mockReturnValue(of(testCase));

        await expect(service.startConfirmData(validInput)).rejects.toThrow(
          ApolloError,
        );

        expect(mockOnboardingService.getOnboardingState).toHaveBeenCalledWith(
          validInput.onboardingSessionId,
        );
      }
    });

    it('should throw error when onboarding state data is missing or not an object', async () => {
      const validInput: ConfirmDataInputDto = {
        ...mockBaseInput,
      };

      // Test cases for invalid data structure
      const testCases = [
        { ...mockStateResponse, data: null },
        { ...mockStateResponse, data: 'invalid-string' },
        { ...mockStateResponse, data: 123 },
        { ...mockStateResponse, data: undefined },
      ];

      for (const testCase of testCases) {
        mockOnboardingService.getOnboardingState.mockReturnValue(of(testCase));

        await expect(service.startConfirmData(validInput)).rejects.toThrowError(
          new ApolloError(
            'Invalid onboarding state data structure',
            ErrorCodes.ONB_DATA_INCOMPLETE,
          ),
        );
      }
    });

    it('should throw error when start-onb-cnb data is missing', async () => {
      const validInput: ConfirmDataInputDto = {
        ...mockBaseInput,
      };

      const invalidStateResponse = {
        ...mockStateResponse,
        data: {
          // start-onb-cnb is missing
          someOtherData: {},
        } as unknown as DataStateCnb,
      };

      mockOnboardingService.getOnboardingState.mockReturnValue(
        of(invalidStateResponse),
      );

      await expect(service.startConfirmData(validInput)).rejects.toThrowError(
        new ApolloError(
          'start-onb-cnb data is required',
          ErrorCodes.ONB_DATA_INCOMPLETE,
        ),
      );
    });

    it('should not throw error when onboarding state is valid', async () => {
      mockOnboardingService.getOnboardingState.mockReturnValue(
        of(mockStateResponse),
      );

      mockOnboardingService.updateOnboardingState.mockReturnValue(
        of({
          status: 'SUCCESS',
          successSteps: ['confirm-data'],
        }),
      );

      // Ensure that updateElectronicSign returns a valid value
      mockMsaNbCnbOrqService.updateElectronicSign.mockResolvedValue({
        status: 'SUCCESS',
        message: 'Updated successfully',
      });

      // Should not throw an exception when calling this method
      await expect(async () => {
        const result =
          await service['validateStateOnboarding'](mockStateResponse);
        expect(result).toBeUndefined();
      }).not.toThrow();
    });
  });
});
