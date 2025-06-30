import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaNbConfigurationService } from '../services/rest-msa-nb-configuration.service';
import { FakeMsaNbConfigurationService } from '../services/fake-msa-nb-configuration.service';
import {
  MSA_NB_CONFIGURATION_SERVICE,
  msaNbConfigurationServiceProvider,
} from './msa-nb-configuration-provider';

describe('msaNbConfigurationServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestMsaNbConfigurationService when MSA_NB_CONFIGURATION_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbConfigurationServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_NB_CONFIGURATION_SERVICE);
    expect(service).toBeInstanceOf(RestMsaNbConfigurationService);
  });

  it('should provide FakeMsaNbConfigurationService when MSA_NB_CONFIGURATION_SERVICE_TYPE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbConfigurationServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_NB_CONFIGURATION_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaNbConfigurationService);
  });

  it('should provide RestMsaNbConfigurationService when MSA_NB_CONFIGURATION_SERVICE_TYPE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbConfigurationServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_NB_CONFIGURATION_SERVICE);
    expect(service).toBeInstanceOf(RestMsaNbConfigurationService);
  });

  it('should inject ConfigService and HttpService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbConfigurationServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_NB_CONFIGURATION_SERVICE);
    expect(service).toBeInstanceOf(RestMsaNbConfigurationService);
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_NB_CONFIGURATION_SERVICE_TYPE',
    );
  });
});
