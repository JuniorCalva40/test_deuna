import { Test, TestingModule } from '@nestjs/testing';
import {
  MSA_TL_BP_DATA_PROVIDER_SERVICE,
  msaTlBpDataProvider,
} from './msa-tl-bp-data-provider';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MsaTlBpDataProviderService } from '../services/msa-tl-bp-data-provider.service';

describe('msaTlBpDataProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide MsaTlOpensearchManagerService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlBpDataProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(MSA_TL_BP_DATA_PROVIDER_SERVICE);
    expect(clientService).toBeInstanceOf(MsaTlBpDataProviderService);
  });

  it('should inject ConfigService and HttpService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlBpDataProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(MSA_TL_BP_DATA_PROVIDER_SERVICE);
    expect(clientService).toBeInstanceOf(MsaTlBpDataProviderService);
  });
});
