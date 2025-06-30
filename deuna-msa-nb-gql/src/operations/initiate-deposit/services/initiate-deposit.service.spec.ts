import { Test, TestingModule } from '@nestjs/testing';
import { InitiateDepositService } from './initiate-deposit.service';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { InitiateDepositInput } from '../dto/initiate-deposit-input.dto';
import { InitiateDepositResponse } from '../dto/initiate-deposit-response.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { of, throwError } from 'rxjs';

describe('InitiateDepositService', () => {
  let service: InitiateDepositService;
  let msaNbOrqTransactionService: IMsaNbOrqTransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiateDepositService,
        {
          provide: MSA_NB_ORQ_TRANSACTION_SERVICE,
          useValue: {
            initiateDeposit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InitiateDepositService>(InitiateDepositService);
    msaNbOrqTransactionService = module.get<IMsaNbOrqTransactionService>(
      MSA_NB_ORQ_TRANSACTION_SERVICE,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateDeposit', () => {
    it('should return a successful response', async () => {
      const input: InitiateDepositInput = { QRid: 'test-qr-id' };
      const mockResponse = {
        accountNumber: 'test-accountNumber',
        beneficiaryName: 'test-beneficiaryName',
        identification: 'test-identification',
      } as InitiateDepositResponse;

      jest
        .spyOn(msaNbOrqTransactionService, 'initiateDeposit')
        .mockReturnValue(of(mockResponse));

      const result = await service.initiateDeposit(input);

      expect(result).toEqual({ ...mockResponse, status: 'SUCCESS' });
      expect(msaNbOrqTransactionService.initiateDeposit).toHaveBeenCalledWith(
        input,
      );
    });

    it('should handle an error and return a handled error response', async () => {
      const input: InitiateDepositInput = { QRid: 'test-qr-id' };
      const mockError = new Error('Mock error');

      jest
        .spyOn(msaNbOrqTransactionService, 'initiateDeposit')
        .mockReturnValue(throwError(() => mockError));
      jest.spyOn(ErrorHandler, 'handleError').mockReturnValue({
        status: 'ERROR',
        message: 'Error handled',
      } as never);

      const result = await service.initiateDeposit(input);

      expect(result).toEqual({ status: 'ERROR', message: 'Error handled' });
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        mockError,
        'initiate-deposit',
      );
    });

    it('should handle a null response and return a handled error response', async () => {
      const input: InitiateDepositInput = { QRid: 'test-qr-id' };

      jest
        .spyOn(msaNbOrqTransactionService, 'initiateDeposit')
        .mockReturnValue(of(null));
      jest.spyOn(ErrorHandler, 'handleError').mockReturnValue({
        status: 'ERROR',
        message: 'Error handled',
      } as never);

      const result = await service.initiateDeposit(input);

      expect(result).toEqual({ status: 'ERROR', message: 'Error handled' });
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        null,
        'initiate-deposit',
      );
    });
  });
});

