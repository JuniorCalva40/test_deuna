import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmDepositService } from './confirm-deposit.service';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { ConfirmDepositServiceInput } from '../dto/confirm-deposit-input.dto';
import { of, throwError } from 'rxjs';
import { ApolloError } from 'apollo-server-core';

describe('InitiateAccountDepositService', () => {
  let service: ConfirmDepositService;
  let msaNbOrqTransactionService: IMsaNbOrqTransactionService;

  const mockValidInput: ConfirmDepositServiceInput = {
    trackingId: 'test-trackinId',
    transactionId: 'test-transaction',
    deviceId: 'test-deviceId',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmDepositService,
        {
          provide: MSA_NB_ORQ_TRANSACTION_SERVICE,
          useValue: {
            confirmDeposit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConfirmDepositService>(
      ConfirmDepositService,
    );
    msaNbOrqTransactionService = module.get<IMsaNbOrqTransactionService>(
      MSA_NB_ORQ_TRANSACTION_SERVICE,
    );
  });

  describe('service response handling', () => {
    it('must handle undefined service response', async () => {
      jest
        .spyOn(msaNbOrqTransactionService, 'confirmDeposit')
        .mockReturnValue(of(undefined));

      try {
        await service.confirmDeposit(mockValidInput);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.extensions.errorResponse).toEqual({
          status: 'ERROR',
          errors: [
            {
              code: 'NB_ERR_905',
              message: '[NB_ERR_1113] Error: confirm-deposit',
              context: 'confirm-deposit',
            },
          ],
        });
      }
    });

    it('must handle service errors', async () => {
      const mockError = new Error('Service error');
      jest
        .spyOn(msaNbOrqTransactionService, 'confirmDeposit')
        .mockReturnValue(throwError(() => mockError));

      try {
        await service.confirmDeposit(mockValidInput);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.extensions.errorResponse.errors[0].message).toBe(
          'Service error',
        );
      }
    });

    it('should return a properly formatted response on success', async () => {
      const mockResponse = {
        status: 'SUCCESS',
        message: 'Deposit confirmed',
        transactionNumber: undefined,
        transactionDate: undefined,
      };
    
      jest
        .spyOn(msaNbOrqTransactionService, 'confirmDeposit')
        .mockReturnValue(of(mockResponse));
    
      const result = await service.confirmDeposit(mockValidInput);
    
      expect(result).toEqual({
        status: 'SUCCESS',
        message: 'Deposit confirmed',
        transactionNumber: '',
        transactionDate: '',
      });
    });

    it('should handle response with status ERROR', async () => {
      const mockErrorResponse = {
        status: 'ERROR',
        message: 'Something went wrong',
      };
    
      jest
        .spyOn(msaNbOrqTransactionService, 'confirmDeposit')
        .mockReturnValue(of(mockErrorResponse));
    
      try {
        await service.confirmDeposit(mockValidInput);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.extensions.errorResponse).toEqual({
          status: 'ERROR',
          errors: [
            {
              code: 'NB_ERR_905',
              message: 'Something went wrong',
              context: 'confirm-deposit',
            },
          ],
        });
      }
    });
  });
});
