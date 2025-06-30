import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RestMsaNbAliasManagementService } from '../services/rest-msa-nb-alias-management.service';
import {
  msaNbAliasManagementServiceProvider,
  MSA_NB_ALIAS_MANAGEMENT_SERVICE,
} from './msa-nb-alias-management.provider';

describe('msaNbAliasManagementServiceProvider', () => {
  let httpService: HttpService;
  let configService: ConfigService;
  let provider: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: HttpService,
          useValue: {
            // Mock HttpService methods if needed
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MSA_NB_ALIAS_MANAGEMENT_URL') {
                return 'http://msa-nb-alias-management';
              }
              if (key === 'httpClient.retry') {
                return 2;
              }
              return null;
            }),
          },
        },
        msaNbAliasManagementServiceProvider,
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    provider = module.get(MSA_NB_ALIAS_MANAGEMENT_SERVICE);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should return an instance of RestMsaNbAliasManagementService', () => {
    expect(provider).toBeInstanceOf(RestMsaNbAliasManagementService);
  });

  it('should inject HttpService and ConfigService correctly', () => {
    expect(provider['httpService']).toBe(httpService);
    expect(provider['configService']).toBe(configService);
  });

  it('should set the correct apiUrl and retryAttempts', () => {
    expect(provider['apiUrl']).toBe('http://msa-nb-alias-management');
    expect(provider['retryAttempts']).toBe(2);
  });
});
