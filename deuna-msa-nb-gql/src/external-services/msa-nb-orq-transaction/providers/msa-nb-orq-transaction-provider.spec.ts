import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaNbOrqTransactionService } from '../services/rest-msa-nb-orq-transaction.service';
import { FakeMsaNbOrqTransactionService } from '../services/fake-msa-nb-orq-transaction.service';
import {
  MSA_NB_ORQ_TRANSACTION_SERVICE,
  msaNbOrqTransactionServiceProvider,
} from './msa-nb-orq-transaction-provider';

describe('msaNbOrqTransactionServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestMsaNbOrqTransactionService when MSA_NB_ORQ_TRANSACTION_SERVICE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbOrqTransactionServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_NB_ORQ_TRANSACTION_SERVICE);
    expect(service).toBeInstanceOf(RestMsaNbOrqTransactionService);
  });

  it('should provide FakeMsaNbOrqTransactionService when MSA_NB_ORQ_TRANSACTION_SERVICE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbOrqTransactionServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_NB_ORQ_TRANSACTION_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaNbOrqTransactionService);
  });

  it('should provide RestMsaNbOrqTransactionService when MSA_NB_ORQ_TRANSACTION_SERVICE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbOrqTransactionServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_NB_ORQ_TRANSACTION_SERVICE);
    expect(service).toBeInstanceOf(RestMsaNbOrqTransactionService);
  });
});
