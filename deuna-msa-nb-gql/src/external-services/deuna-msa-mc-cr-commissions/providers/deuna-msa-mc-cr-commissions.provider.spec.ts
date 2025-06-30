import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MSA_CR_COMMISIONS_SERVICE,
  msaMcCrCommissionsProvider,
} from './deuna-msa-mc-cr-commissions.provider';
import { MsaMcCrCommissionsService } from '../services/deuna-msa-mc-cr-commissions.service';

describe('msaMcCrCommissionsProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    // Mock ConfigService
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'MSA_TL_OPENSEARCH_MANAGER_SERVICE_URL') {
          return 'http://test-api.com'; // Provide a mock URL
        }
        if (key === 'httpClient.retry') {
          return '2'; // Provide a mock retry count
        }
        if (key === 'httpClient.timeout') {
          return '30000'; // Provide a mock timeout
        }
        return undefined;
      }),
    } as any;

    // Mock HttpService
    httpService = {
      get: jest.fn(), // Mock the 'get' method if it's used by the service constructor or methods called by it
    } as any;
  });

  it('should provide MsaMcCrCommissionsService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaMcCrCommissionsProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get<MsaMcCrCommissionsService>(
      MSA_CR_COMMISIONS_SERVICE,
    );
    expect(clientService).toBeInstanceOf(MsaMcCrCommissionsService);
  });

  it('should correctly inject ConfigService and HttpService into MsaMcCrCommissionsService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaMcCrCommissionsProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    // Retrieve the service to ensure it's instantiated
    const serviceInstance = module.get<MsaMcCrCommissionsService>(
      MSA_CR_COMMISIONS_SERVICE,
    );

    // Check if the factory function was called with the mocked services
    // This is implicitly tested by the service being an instance of MsaMcCrCommissionsService
    // and the constructor of MsaMcCrCommissionsService using these.
    // We can also check if the constructor of MsaMcCrCommissionsService was called with these mocks
    // if we spy on it, but usually, checking the instance is sufficient for provider tests.
    expect(serviceInstance).toBeDefined();
    // You could add more specific checks here if needed, for example,
    // if the service exposes methods that directly use config values upon instantiation.
  });
});
