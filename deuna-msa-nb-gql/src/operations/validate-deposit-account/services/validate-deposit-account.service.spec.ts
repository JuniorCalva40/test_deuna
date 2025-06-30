import { Test, TestingModule } from '@nestjs/testing';
import { ValidateDepositAccountService } from './validate-deposit-account.service';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { ValidateDepositAccountServiceInput } from '../dto/validate-deposit-account-input.dto';
import { of, throwError } from 'rxjs';
import { ApolloError } from 'apollo-server-core';

describe('ValidateDepositAccountService', () => {
  let service: ValidateDepositAccountService;
  let msaNbOrqTransactionService: IMsaNbOrqTransactionService;

  const mockValidInput: ValidateDepositAccountServiceInput = {
    trackingId: 'trackingId',
    beneficiaryPhoneNumber: '1234567890',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateDepositAccountService,
        {
          provide: MSA_NB_ORQ_TRANSACTION_SERVICE,
          useValue: {
            validateDepositAccount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ValidateDepositAccountService>(
      ValidateDepositAccountService,
    );
    msaNbOrqTransactionService = module.get<IMsaNbOrqTransactionService>(
      MSA_NB_ORQ_TRANSACTION_SERVICE,
    );
  });

  describe('service response handling', () => {
    it('must handle undefined service response', async () => {
      jest
        .spyOn(msaNbOrqTransactionService, 'validateDepositAccount')
        .mockReturnValue(of(undefined));

      try {
        await service.validateDepositAccount(mockValidInput);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.extensions.errorResponse).toEqual({
          status: 'ERROR',
          errors: [
            {
              code: 'NB_ERR_905',
              message: '[NB_ERR_1114] Error: validate-deposit-account',
              context: 'validate-deposit-account',
            },
          ],
        });
      }
    });

    it('must handle service errors', async () => {
      const mockError = new Error('Service error');
      jest
        .spyOn(msaNbOrqTransactionService, 'validateDepositAccount')
        .mockReturnValue(throwError(() => mockError));

      try {
        await service.validateDepositAccount(mockValidInput);
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
        message: 'Account validated',
        beneficiaryAccountNumber: '1234567890',
        beneficiaryName: 'John Doe',
      };
    
      jest
        .spyOn(msaNbOrqTransactionService, 'validateDepositAccount')
        .mockReturnValue(of(mockResponse));
    
      const result = await service.validateDepositAccount(mockValidInput);
    
      expect(result).toEqual({
        status: 'SUCCESS',
        message: 'Account validated',
        beneficiaryAccountNumber: '1234567890',
        beneficiaryName: 'John Doe',
      });
    });

    it('should handle response with status ERROR', async () => {
      const mockErrorResponse = {
        status: 'ERROR',
        message: 'Something went wrong',
        beneficiaryAccountNumber: undefined,
        beneficiaryName: undefined,
      };
    
      jest
        .spyOn(msaNbOrqTransactionService, 'validateDepositAccount')
        .mockReturnValue(of(mockErrorResponse));
    
      try {
        await service.validateDepositAccount(mockValidInput);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.extensions.errorResponse).toEqual({
          status: 'ERROR',
          errors: [
            {
              code: 'NB_ERR_905',
              message: 'Something went wrong',
              context: 'validate-deposit-account',
            },
          ],
        });
      }
    });
  });
});
