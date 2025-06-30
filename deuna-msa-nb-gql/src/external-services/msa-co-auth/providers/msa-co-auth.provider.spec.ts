import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoAuthService } from '../services/rest-msa-co-auth.service';
import { FakeMsaCoAuthService } from '../services/fake-msa-co-auth.service';
import {
  MSA_CO_AUTH_SERVICE,
  msaCoAuthServiceProvider,
} from './msa-co-auth.provider';

describe('msaCoAuthServiceProvider', () => {
  let mockConfigValue: string | undefined;

  const createTestingModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation(() => mockConfigValue),
          },
        },
        {
          provide: HttpService,
          useValue: {},
        },
        msaCoAuthServiceProvider,
      ],
    }).compile();
  };

  it('should provide RestMsaCoAuthService when type is not "mock"', async () => {
    mockConfigValue = 'rest';
    const moduleRef = await createTestingModule();
    const service = moduleRef.get(MSA_CO_AUTH_SERVICE);

    expect(service).toBeInstanceOf(RestMsaCoAuthService);
    expect(moduleRef.get(ConfigService).get).toHaveBeenCalledWith(
      'MSA_CO_AUTH_SERVICE_TYPE',
    );
  });

  it('should provide FakeMsaCoAuthService when type is "mock"', async () => {
    mockConfigValue = 'mock';
    const moduleRef = await createTestingModule();
    const service = moduleRef.get(MSA_CO_AUTH_SERVICE);

    expect(service).toBeInstanceOf(FakeMsaCoAuthService);
    expect(moduleRef.get(ConfigService).get).toHaveBeenCalledWith(
      'MSA_CO_AUTH_SERVICE_TYPE',
    );
  });

  it('should provide RestMsaCoAuthService when type is not defined', async () => {
    mockConfigValue = undefined;
    const moduleRef = await createTestingModule();
    const service = moduleRef.get(MSA_CO_AUTH_SERVICE);

    expect(service).toBeInstanceOf(RestMsaCoAuthService);
  });

  it('should provide RestMsaCoAuthService when type is unsupported', async () => {
    mockConfigValue = 'unsupported';
    const moduleRef = await createTestingModule();
    const service = moduleRef.get(MSA_CO_AUTH_SERVICE);

    expect(service).toBeInstanceOf(RestMsaCoAuthService);
  });

  it('should inject ConfigService and HttpService', async () => {
    mockConfigValue = 'rest';
    const moduleRef = await createTestingModule();
    const service = moduleRef.get(MSA_CO_AUTH_SERVICE);

    expect(service).toBeInstanceOf(RestMsaCoAuthService);
    expect(moduleRef.get(ConfigService).get).toHaveBeenCalledWith(
      'MSA_CO_AUTH_SERVICE_TYPE',
    );
    expect(moduleRef.get(HttpService)).toBeDefined();
  });

  it('should use the factory function to create the service', async () => {
    mockConfigValue = 'rest';
    const moduleRef = await createTestingModule();
    const provider = moduleRef.get(MSA_CO_AUTH_SERVICE);

    expect(provider).toBeInstanceOf(RestMsaCoAuthService);
  });
});
