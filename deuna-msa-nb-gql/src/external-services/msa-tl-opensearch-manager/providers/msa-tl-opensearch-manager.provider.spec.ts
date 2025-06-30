import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import {
  MSA_TL_OPENSEARCH_MANAGER_SERVICE,
  msaTlOpensearchManagerProvider,
} from './msa-tl-opensearch-manager.provider';
import { MsaTlOpensearchManagerService } from '../services/msa-tl-opensearch-manager.service';

describe('msaTlOpensearchManagerProvider', () => {
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
        msaTlOpensearchManagerProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(MSA_TL_OPENSEARCH_MANAGER_SERVICE);
    expect(clientService).toBeInstanceOf(MsaTlOpensearchManagerService);
  });

  it('should inject ConfigService and HttpService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlOpensearchManagerProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(MSA_TL_OPENSEARCH_MANAGER_SERVICE);
    expect(clientService).toBeInstanceOf(MsaTlOpensearchManagerService);
  });
});
