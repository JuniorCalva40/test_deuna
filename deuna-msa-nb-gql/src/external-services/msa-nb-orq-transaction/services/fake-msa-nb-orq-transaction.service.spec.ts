import { Test, TestingModule } from '@nestjs/testing';
import { FakeMsaNbOrqTransactionService } from './fake-msa-nb-orq-transaction.service';
import { lastValueFrom } from 'rxjs';

describe('FakeMsaNbOrqTransactionService', () => {
  let service: FakeMsaNbOrqTransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FakeMsaNbOrqTransactionService],
    }).compile();

    service = module.get<FakeMsaNbOrqTransactionService>(
      FakeMsaNbOrqTransactionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRucByIdentification', () => {
    it('should return data for a valid identification', async () => {
      const result = await lastValueFrom(
        service.initiateDeposit({ QRid: 'test-qr-id' }),
      );

      expect(result).toBeDefined();
      expect(result.accountNumber).toBe('fake-account-number');
      expect(result.beneficiaryName).toBe('fake-beneficiary-name');
      expect(result.identification).toBe('fake-identification');
    });

    it('should return undefined for an invalid identification', async () => {
      try {
        const result = await lastValueFrom(service.initiateDeposit(undefined));
      } catch (error) {
        expect(error.message).toBe('InitiateDepositInput is required');
      }
    });
  });
});

