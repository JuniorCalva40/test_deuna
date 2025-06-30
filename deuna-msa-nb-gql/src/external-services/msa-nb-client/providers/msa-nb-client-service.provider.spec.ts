import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaNbClientService } from '../services/rest-msa-nb-client.service';
import { FakeMsaNbClientService } from '../services/fake-msa-nb-client.service';
import {
  MSA_NB_CLIENT_SERVICE,
  msaNbClientServiceProvider,
} from './msa-nb-client-service.provider';

describe('msaNbClientServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestMsaNbClientService when MSA_NB_CLIENT_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbClientServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(MSA_NB_CLIENT_SERVICE);
    expect(clientService).toBeInstanceOf(RestMsaNbClientService);
  });

  it('should provide FakeMsaNbClientService when MSA_NB_CLIENT_SERVICE_TYPE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbClientServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(MSA_NB_CLIENT_SERVICE);
    expect(clientService).toBeInstanceOf(FakeMsaNbClientService);
  });

  it('should provide RestMsaNbClientService when MSA_NB_CLIENT_SERVICE_TYPE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbClientServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(MSA_NB_CLIENT_SERVICE);
    expect(clientService).toBeInstanceOf(RestMsaNbClientService);
  });

  it('should inject ConfigService and HttpService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbClientServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(MSA_NB_CLIENT_SERVICE);
    expect(clientService).toBeInstanceOf(RestMsaNbClientService);
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_NB_CLIENT_SERVICE_TYPE',
    );
  });
});
