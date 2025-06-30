import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  MSA_CO_CALIFICATION_SERVICE,
  msaCoCalificationServiceProvider,
} from './msa-co-calification.provider';
import { RestMsaCoCalificationService } from '../service/rest-msa-co-calification.service';
import { FakeMsaCoCalificationService } from '../service/fake-msa-co-calification.service';

describe('MsaCoCalificationProvider', () => {
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
        msaCoCalificationServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();
  };

  it('should provide RestMsaCoCalificationService when service type is not mock', async () => {
    configService.get.mockReturnValue('rest');
    module = await createTestingModule();

    const service = module.get(MSA_CO_CALIFICATION_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoCalificationService);
  });

  it('should provide FakeMsaCoCalificationService when service type is mock', async () => {
    configService.get.mockReturnValue('mock');
    module = await createTestingModule();

    const service = module.get(MSA_CO_CALIFICATION_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaCoCalificationService);
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_CO_CALIFICATION_SERVICE_TYPE',
    );
  });

  it('should inject required dependencies for RestMsaCoCalificationService', async () => {
    configService.get.mockReturnValue('rest');
    module = await createTestingModule();

    const service = module.get(MSA_CO_CALIFICATION_SERVICE);
    expect(service['configService']).toBeDefined();
  });
});
