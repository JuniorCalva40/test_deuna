import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestBussinesRuleService } from '../services/rest-bussines-rule.service';
import { FakeBussinesRuleService } from '../services/fake-bussines-rule.service';
import {
  BUSSINES_RULE_SERVICE,
  bussinesRuleServiceProvider,
} from './bussines-rules-service.provider';

describe('bussinesRuleServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestBussinesRuleService when BUSSINES_RULE_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        bussinesRuleServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(BUSSINES_RULE_SERVICE);
    expect(clientService).toBeInstanceOf(RestBussinesRuleService);
  });

  it('should provide FakeBussinesRuleService when BUSSINES_RULE_SERVICE_TYPE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        bussinesRuleServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(BUSSINES_RULE_SERVICE);
    expect(clientService).toBeInstanceOf(FakeBussinesRuleService);
  });

  it('should provide RestBussinesRuleService when BUSSINES_RULE_SERVICE_TYPE is invalid', async () => {
    configService.get.mockReturnValue('invalid');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        bussinesRuleServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(BUSSINES_RULE_SERVICE);
    expect(clientService).toBeInstanceOf(RestBussinesRuleService);
  });

  it('should inject ConfigService and HttpService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        bussinesRuleServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const clientService = module.get(BUSSINES_RULE_SERVICE);
    expect(clientService).toBeInstanceOf(RestBussinesRuleService);
    expect(configService.get).toHaveBeenCalledWith(
      'BUSSINES_RULE_SERVICE_TYPE',
    );
  });
});
