import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { InitiateCellPhoneDepositServiceInput } from '../dto/initiate-cellphone-deposit-input.dto';
import { InitiateCellPhoneDepositService } from './initiate-cellphone-deposit.service';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { ApolloError } from 'apollo-server-core';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';

jest.mock('../../../utils/error-handler.util');

describe('InitiateCellPhoneDepositService', () => {
  let service: InitiateCellPhoneDepositService;
  let msaNbOrqTransactionService: IMsaNbOrqTransactionService;
  const mockedErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

  const mockValidInput: InitiateCellPhoneDepositServiceInput = {
    beneficiaryPhoneNumber: '1234567890',
    ordererIdentification: '0987654321',
    ipAddress: '127.0.0.1',
    deviceId: 'test-device',
    sessionId: 'test-session',
    trackingId: 'test-tracking',
    amount: 100,
    reason: 'Test deposit',
    requestId: 'test-request-id',
  };

  const mockMsaNbOrqTransactionService = {
    initiateCellPhoneDeposit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiateCellPhoneDepositService,
        {
          provide: MSA_NB_ORQ_TRANSACTION_SERVICE,
          useValue: mockMsaNbOrqTransactionService,
        },
      ],
    }).compile();

    service = module.get<InitiateCellPhoneDepositService>(
      InitiateCellPhoneDepositService,
    );
    msaNbOrqTransactionService = module.get<IMsaNbOrqTransactionService>(
      MSA_NB_ORQ_TRANSACTION_SERVICE,
    );

    mockedErrorHandler.handleError.mockImplementation((error) => {
      let message = 'An error occurred';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      throw new ApolloError(message);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateCellPhoneDeposit', () => {
    it('should successfully initiate a deposit and handle partial data', async () => {
      const mockResponse = {
        status: 'SUCCESS',
        message: 'Deposit initiated',
        beneficiaryAccountNumber: '12345',
        beneficiaryName: null,
        ordererAccountNumber: '54321',
        ordererName: 'Orderer',
        transactionId: undefined,
      };
      mockMsaNbOrqTransactionService.initiateCellPhoneDeposit.mockReturnValue(
        of(mockResponse),
      );

      const result = await service.initiateCellPhoneDeposit(mockValidInput);

      expect(result).toEqual({
        ...mockResponse,
        beneficiaryName: '',
        transactionId: '',
      });
      expect(
        msaNbOrqTransactionService.initiateCellPhoneDeposit,
      ).toHaveBeenCalledWith(mockValidInput);
    });

    it('should handle errors from the transaction service', async () => {
      const mockError = new Error('Service failure');
      mockMsaNbOrqTransactionService.initiateCellPhoneDeposit.mockReturnValue(
        throwError(() => mockError),
      );

      await expect(
        service.initiateCellPhoneDeposit(mockValidInput),
      ).rejects.toThrow(ApolloError);

      expect(mockedErrorHandler.handleError).toHaveBeenCalledWith(
        mockError,
        'initiate-cellphone-deposit',
      );
    });

    it('should handle null response from the transaction service', async () => {
      mockMsaNbOrqTransactionService.initiateCellPhoneDeposit.mockReturnValue(
        of(null),
      );

      await expect(
        service.initiateCellPhoneDeposit(mockValidInput),
      ).rejects.toThrow(ApolloError);

      expect(mockedErrorHandler.handleError).toHaveBeenCalledWith(
        'initiate-cellphone-deposit',
        ErrorCodes.INITIATE_CELLPHONE_DEPOSIT_FAILED,
      );
    });

    it('should handle ERROR status from the transaction service', async () => {
      const mockErrorResponse = {
        status: 'ERROR',
        message: 'Invalid transaction',
      };
      mockMsaNbOrqTransactionService.initiateCellPhoneDeposit.mockReturnValue(
        of(mockErrorResponse),
      );

      await expect(
        service.initiateCellPhoneDeposit(mockValidInput),
      ).rejects.toThrow(ApolloError);

      expect(mockedErrorHandler.handleError).toHaveBeenCalledWith(
        mockErrorResponse,
        'initiate-cellphone-deposit',
      );
    });
  });
});
