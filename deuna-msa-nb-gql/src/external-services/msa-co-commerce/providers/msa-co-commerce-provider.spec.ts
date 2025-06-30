import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoCommerceService } from '../service/rest-msa-co-commerce.service';
import { FakeRestMsaCoCommerceService } from '../service/fake-rest-msa-co-commerce.service';
import {
  MSA_CO_COMMERCE_SERVICE,
  msaCoCommerceServiceProvider,
} from './msa-co-commerce-provider';

describe('msaCoCommerceServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestMsaCoCommerceService when MSA_CO_COMMERCE_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoCommerceServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_COMMERCE_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoCommerceService);
  });

  it('should provide FakeRestMsaCoCommerceService when MSA_CO_COMMERCE_SERVICE_TYPE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoCommerceServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_COMMERCE_SERVICE);
    expect(service).toBeInstanceOf(FakeRestMsaCoCommerceService);
  });

  it('should provide RestMsaCoCommerceService when MSA_CO_COMMERCE_SERVICE_TYPE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoCommerceServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_COMMERCE_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoCommerceService);
  });

  it('should inject ConfigService and HttpService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoCommerceServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_COMMERCE_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoCommerceService);
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_CO_COMMERCE_SERVICE_TYPE',
    );
  });
});
