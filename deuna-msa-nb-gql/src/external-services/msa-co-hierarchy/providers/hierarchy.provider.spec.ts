import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { HttpService } from '@nestjs/axios';
import {
  MSA_CO_HIERARCHY_SERVICE,
  hierarchyServiceProvider,
} from './hierarchy.provider';
import { RestHierarchyService } from '../services/rest-hierarchy.service';
import { FakeHierarchyService } from '../services/fake-hierarchy.service';

describe('HierarchyServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let kafkaService: jest.Mocked<KafkaService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    kafkaService = {} as any;

    httpService = {
      get: jest.fn(),
      axiosRef: {},
    } as any;
  });

  it('should provide RestHierarchyService when HIERARCHY_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        hierarchyServiceProvider,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: KafkaService,
          useValue: kafkaService,
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    const service = module.get(MSA_CO_HIERARCHY_SERVICE);
    expect(service).toBeInstanceOf(RestHierarchyService);
  });

  it('should provide RestHierarchyService when HIERARCHY_SERVICE_TYPE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        hierarchyServiceProvider,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: KafkaService,
          useValue: kafkaService,
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    const service = module.get(MSA_CO_HIERARCHY_SERVICE);
    expect(service).toBeInstanceOf(RestHierarchyService);
  });

  it('should provide FakeHierarchyService when HIERARCHY_SERVICE_TYPE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        hierarchyServiceProvider,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: KafkaService,
          useValue: kafkaService,
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    const service = module.get(MSA_CO_HIERARCHY_SERVICE);
    expect(service).toBeInstanceOf(FakeHierarchyService);
  });

  it('should inject ConfigService and KafkaService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        hierarchyServiceProvider,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: KafkaService,
          useValue: kafkaService,
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    const service = module.get(MSA_CO_HIERARCHY_SERVICE);
    expect(service).toBeInstanceOf(RestHierarchyService);
    expect(configService.get).toHaveBeenCalledWith('HIERARCHY_SERVICE_TYPE');
  });
});
