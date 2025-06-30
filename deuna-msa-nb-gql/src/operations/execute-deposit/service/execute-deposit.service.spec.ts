import { Test, TestingModule } from '@nestjs/testing';
import { ExecuteDepositService } from './execute-deposit.service';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { ApolloError } from 'apollo-server-express';
import { of, throwError } from 'rxjs';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { mock } from 'node:test';

describe('ExecuteDepositService', () => {
  let service: ExecuteDepositService;
  let mockMsaNbOrqTransactionService: jest.Mocked<IMsaNbOrqTransactionService>;
  let loggerSpy: jest.SpyInstance;

  const mockValidInput = {
    transactionId: 'TRANS-123',
    amount: '100.5',
  };

  const mockValidContext = {
    deviceId: 'DEVICE-123',
    sessionId: 'SESSION-123',
    ip: '192.168.1.1',
    trackingId: 'mock-tracking-id',
  };

  const mockSuccessResponse = {
    message: 'Deposit successfully processed',
    status: 'SUCCESS',
  };

  beforeEach(async () => {
    mockMsaNbOrqTransactionService = {
      executeDeposit: jest.fn(),
      validateDepositAccount: jest.fn(),
      initiateCellPhoneDeposit: jest.fn(),
      generateQr: jest.fn(),
      confirmDeposit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecuteDepositService,
        {
          provide: MSA_NB_ORQ_TRANSACTION_SERVICE,
          useValue: mockMsaNbOrqTransactionService,
        },
      ],
    }).compile();

    service = module.get<ExecuteDepositService>(ExecuteDepositService);
    loggerSpy = jest.spyOn(service['logger'], 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeDeposit', () => {
    describe('successful cases', () => {
      it('should execute the deposit correctly', async () => {
        mockMsaNbOrqTransactionService.executeDeposit.mockReturnValue(
          of({
            status: 'success',
            message: 'Deposit successfully processed',
          }),
        );

        const result = await service.executeDeposit(
          mockValidInput,
          mockValidContext.deviceId,
          mockValidContext.sessionId,
          mockValidContext.ip,
          mockValidContext.trackingId,
        );

        expect(result).toEqual({
          status: 'success',
          message: 'Deposit successfully processed',
        });
      });
    });

    describe('input validation', () => {
      it('should validate empty transactionID', async () => {
        const invalidInput = { ...mockValidInput, transactionId: '' };

        await expect(
          service.executeDeposit(
            invalidInput,
            mockValidContext.deviceId,
            mockValidContext.sessionId,
            mockValidContext.ip,
            mockValidContext.trackingId,
          ),
        ).rejects.toThrow(ApolloError);

        try {
          await service.executeDeposit(
            invalidInput,
            mockValidContext.deviceId,
            mockValidContext.sessionId,
            mockValidContext.ip,
            mockValidContext.trackingId,
          );
        } catch (error) {
          expect(error.extensions.errorResponse.errors[0]).toEqual({
            code: ErrorCodes.TRANSACTION_ID_INVALID,
            message: 'Transaction ID is required',
            context: 'execute-deposit',
          });
        }
      });

      it('should validate invalid amount', async () => {
        const invalidInput = { ...mockValidInput, amount: '0' };

        await expect(
          service.executeDeposit(
            invalidInput,
            mockValidContext.deviceId,
            mockValidContext.sessionId,
            mockValidContext.ip,
            mockValidContext.trackingId,
          ),
        ).rejects.toThrow(ApolloError);
      });

      it('should validate empty deviceId', async () => {
        await expect(
          service.executeDeposit(
            mockValidInput,
            '',
            mockValidContext.sessionId,
            mockValidContext.ip,
            mockValidContext.trackingId,
          ),
        ).rejects.toThrow(ApolloError);
      });

      it('should validate empty sessionId', async () => {
        await expect(
          service.executeDeposit(
            mockValidInput,
            mockValidContext.deviceId,
            '',
            mockValidContext.ip,
            mockValidContext.trackingId,
          ),
        ).rejects.toThrow(ApolloError);
      });

      it('should validate invalid IP format', async () => {
        await expect(
          service.executeDeposit(
            mockValidInput,
            mockValidContext.deviceId,
            mockValidContext.sessionId,
            'invalid-ip',
            mockValidContext.trackingId,
          ),
        ).rejects.toThrow(ApolloError);
      });

      it('should validate IP with out of range values', async () => {
        await expect(
          service.executeDeposit(
            mockValidInput,
            mockValidContext.deviceId,
            mockValidContext.sessionId,
            '256.256.256.256',
            mockValidContext.trackingId,
          ),
        ).rejects.toThrow(ApolloError);
      });
    });

    describe('error handling from transaction service', () => {
      it('should handle empty response from transaction service', async () => {
        mockMsaNbOrqTransactionService.executeDeposit.mockReturnValue(of(null));

        try {
          await service.executeDeposit(
            mockValidInput,
            mockValidContext.deviceId,
            mockValidContext.sessionId,
            mockValidContext.ip,
            mockValidContext.trackingId,
          );
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse.errors[0]).toEqual({
            code: ErrorCodes.TRANSACTION_SERVICE_ERROR,
            message: 'No response received from transaction service',
            context: 'execute-deposit',
          });
        }
      });

      it('should handle failed transaction status', async () => {
        mockMsaNbOrqTransactionService.executeDeposit.mockReturnValue(
          of({
            status: 'success',
            message: 'Cash out executed successfully',
            data: {
              ...mockSuccessResponse,
              transactionStatus: 'FAILED',
            },
          }),
        );

        try {
          await service.executeDeposit(
            mockValidInput,
            mockValidContext.deviceId,
            mockValidContext.sessionId,
            mockValidContext.ip,
            mockValidContext.trackingId,
          );
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse.errors[0]).toEqual({
            code: ErrorCodes.TRANSACTION_PROCESS_FAILED,
            message: 'Transaction processing failed',
            context: 'execute-deposit',
          });
        }
      });

      it('should handle network error', async () => {
        const networkError = new Error('Network error');
        mockMsaNbOrqTransactionService.executeDeposit.mockReturnValue(
          throwError(() => networkError),
        );

        // Mock del ErrorHandler
        const mockErrorHandler = jest.spyOn(ErrorHandler, 'handleError');
        mockErrorHandler.mockImplementation((error) => {
          service['logger'].error(
            'Error in executeDeposit: Network error',
            error.stack,
          );
          throw new ApolloError('Network error', ErrorCodes.SYS_ERROR_UNKNOWN, {
            errorResponse: {
              status: 'ERROR',
              errors: [
                {
                  code: ErrorCodes.SYS_ERROR_UNKNOWN,
                  message: 'Network error',
                  context: 'execute-deposit',
                },
              ],
            },
          });
        });

        try {
          await service.executeDeposit(
            mockValidInput,
            mockValidContext.deviceId,
            mockValidContext.sessionId,
            mockValidContext.ip,
            mockValidContext.trackingId,
          );
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse).toEqual({
            status: 'ERROR',
            errors: [
              {
                code: ErrorCodes.SYS_ERROR_UNKNOWN,
                message: 'Network error',
                context: 'execute-deposit',
              },
            ],
          });
          expect(loggerSpy).toHaveBeenCalledWith(
            'Error in executeDeposit: Network error',
            networkError.stack,
          );
        }

        // Restaurar el mock
        mockErrorHandler.mockRestore();
      });
    });

    it('should handle transaction service error status', async () => {
      const errorMessage = 'Something went wrong in the transaction service';
      const errorResponse = {
        status: 'ERROR',
        message: errorMessage,
      };
    
      mockMsaNbOrqTransactionService.executeDeposit.mockReturnValue(
        of(errorResponse),
      );
    
      try {
        await service.executeDeposit(
          mockValidInput,
          mockValidContext.deviceId,
          mockValidContext.sessionId,
          mockValidContext.ip,
          mockValidContext.trackingId,
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.extensions.errorResponse.errors[0]).toEqual({
          code: ErrorCodes.TRANSACTION_SERVICE_ERROR,
          message: errorMessage,
          context: 'execute-deposit',
        });
      }
    });
  });

  describe('validateExecuteDepositInput', () => {
    const validInput = {
      transactionId: 'TRANS-123',
      sessionId: 'SESSION-123',
      deviceId: 'DEVICE-123',
      deviceIp: '192.168.1.1',
      trackingId: 'mock-tracking-id',
    };

    describe('validation of transactionId', () => {
      it('throws error if it is empty', () => {
        expect(() => {
          service['validateExecuteDepositInput']({
            ...validInput,
            transactionId: '',
          });
        }).toThrow('Transaction ID is required');
      });

      it('throws error if it is undefined', () => {
        expect(() => {
          service['validateExecuteDepositInput']({
            ...validInput,
            transactionId: undefined,
          });
        }).toThrow('Transaction ID is required');
      });
    });

    describe('validation of deviceIp', () => {
      it('throws error if it is invalid', () => {
        expect(() => {
          service['validateExecuteDepositInput']({
            ...validInput,
            deviceIp: 'invalid-ip',
          });
        }).toThrow('Invalid IP address format');
      });

      it('throws error if it is out of range', () => {
        expect(() => {
          service['validateExecuteDepositInput']({
            ...validInput,
            deviceIp: '256.256.256.256',
          });
        }).toThrow('Invalid IP address format');
      });
    });

    describe('validation of required fields', () => {
      const requiredFields = [
        { field: 'sessionId', error: 'Session ID is required' },
        { field: 'deviceId', error: 'Device ID is required' },
      ];

      requiredFields.forEach(({ field, error }) => {
        it(`throws error if ${field} is empty`, () => {
          expect(() => {
            service['validateExecuteDepositInput']({
              ...validInput,
              [field]: '',
            });
          }).toThrow(error);
        });
      });
    });

    describe('validation of IP address', () => {
      it('throws error if it is invalid', () => {
        const invalidIPs = [
          '192.168.1',
          '192.168.1.1.1',
          '192.168.1.',
          '.192.168.1.1',
          'abc.def.ghi.jkl',
        ];

        invalidIPs.forEach((ip) => {
          expect(() => {
            service['validateExecuteDepositInput']({
              ...validInput,
              deviceIp: ip,
            });
          }).toThrow('Invalid IP address format');
        });
      });

      it('accepts valid IPs', () => {
        const validIPs = [
          '192.168.1.1',
          '10.0.0.0',
          '172.16.254.1',
          '0.0.0.0',
          '255.255.255.255',
        ];

        validIPs.forEach((ip) => {
          expect(() => {
            service['validateExecuteDepositInput']({
              ...validInput,
              deviceIp: ip,
            });
          }).not.toThrow();
        });
      });
    });

    describe('validation of trackingId', () => {
      it('throws error if it is empty', () => {
        expect(() => {
          service['validateExecuteDepositInput']({
            ...validInput,
            trackingId: '',
          });
        }).toThrow('Tracking ID is required');
      });

      it('throws error if it is undefined', () => {
        expect(() => {
          service['validateExecuteDepositInput']({
            ...validInput,
            trackingId: undefined,
          });
        }).toThrow('Tracking ID is required');
      });
    });
  });
});
