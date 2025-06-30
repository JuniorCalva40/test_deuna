import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  MSA_MC_BO_CLIENT_SERVICE,
  msaBoMcClientServiceProvider,
} from './msa-mc-bo-client.provider';
import { RestMsaMcBoClientService } from '../service/rest-msa-mc-bo-client.service';
import { FakeMsaBoMcClientService } from '../service/fake-msa-mc-bo-client.service';

describe('MsaBoMcClientProvider', () => {
  let module: TestingModule;
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  const createTestingModule = async () => {
    return Test.createTestingModule({
      providers: [
        msaBoMcClientServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();
  };

  it('should provide RestMsaBoMcClientService when service type is not mock', async () => {
    configService.get.mockReturnValue('rest');
    module = await createTestingModule();

    const service = module.get(MSA_MC_BO_CLIENT_SERVICE);
    expect(service).toBeInstanceOf(RestMsaMcBoClientService);
  });

  it('should provide FakeMsaBoMcClientService when service type is mock', async () => {
    configService.get.mockReturnValue('mock');
    module = await createTestingModule();

    const service = module.get(MSA_MC_BO_CLIENT_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaBoMcClientService);
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_MC_BO_CLIENT_SERVICE_TYPE',
    );
  });

  it('should inject required dependencies for RestMsaBoMcClientService', async () => {
    configService.get.mockReturnValue('rest');
    module = await createTestingModule();

    const service = module.get(MSA_MC_BO_CLIENT_SERVICE);
    expect(service['configService']).toBeDefined();
  });
});
