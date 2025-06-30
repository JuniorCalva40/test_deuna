import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  MSA_TL_TEMPLATE_GENERATOR_SERVICE,
  msaTlTemplateGeneratorServiceProvider,
} from './msa-tl-template-generator.provider';
import { RestMsaTlTemplateGeneratorService } from '../services/rest-msa-tl-template-generator.service';
import { FakeMsaTlTemplateGeneratorService } from '../services/fake-msa-tl-template-generator.service';

describe('msaTlTemplateGeneratorServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestMsaTlTemplateGeneratorService when MSA_TL_TEMPLATE_GENERATOR_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlTemplateGeneratorServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_TL_TEMPLATE_GENERATOR_SERVICE);
    expect(service).toBeInstanceOf(RestMsaTlTemplateGeneratorService);
  });

  it('should provide FakeMsaTlTemplateGeneratorService when MSA_TL_TEMPLATE_GENERATOR_SERVICE_TYPE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlTemplateGeneratorServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_TL_TEMPLATE_GENERATOR_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaTlTemplateGeneratorService);
  });

  it('should provide RestMsaTlTemplateGeneratorService when MSA_TL_TEMPLATE_GENERATOR_SERVICE_TYPE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlTemplateGeneratorServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_TL_TEMPLATE_GENERATOR_SERVICE);
    expect(service).toBeInstanceOf(RestMsaTlTemplateGeneratorService);
  });

  it('should inject ConfigService and HttpService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlTemplateGeneratorServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_TL_TEMPLATE_GENERATOR_SERVICE);
    expect(service).toBeInstanceOf(RestMsaTlTemplateGeneratorService);
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_TL_TEMPLATE_GENERATOR_SERVICE_TYPE',
    );
  });
});
