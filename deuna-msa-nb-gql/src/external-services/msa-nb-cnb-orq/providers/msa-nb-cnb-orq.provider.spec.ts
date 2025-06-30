import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Provider } from '@nestjs/common';
import { msaNbCnbOrqServiceProvider } from './msa-nb-cnb-orq.provider';
import { MSA_NB_CNB_ORQ_SERVICE } from '../interfaces/msa-nb-cnb-orq-service.interface';
import { RestMsaNbCnbOrqService } from '../services/rest-msa-nb-cnb-orq.service';
import { KafkaService } from '@deuna/tl-kafka-nd';

type CustomProvider = Provider & {
  useFactory: (
    configService: ConfigService,
    httpService: HttpService,
    kafkaService: KafkaService,
  ) => RestMsaNbCnbOrqService;
  provide: any;
  inject: any[];
};

describe('msaNbCnbOrqServiceProvider', () => {
  let configService: ConfigService;
  let httpService: HttpService;
  let kafkaService: KafkaService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'MSA_NB_CNB_ORQ_SERVICE_TYPE') {
        return 'rest';
      }
      if (key === 'MSA_NB_CNB_ORQ_URL') {
        return 'http://test-url';
      }
      return undefined;
    }),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockKafkaService = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbCnbOrqServiceProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    httpService = module.get<HttpService>(HttpService);
    kafkaService = module.get<KafkaService>(KafkaService);
  });

  it('should create RestMsaNbCnbOrqService when service type is not mock', () => {
    // Arrange
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'MSA_NB_CNB_ORQ_SERVICE_TYPE') {
        return 'rest';
      }
      if (key === 'MSA_NB_CNB_ORQ_URL') {
        return 'http://test-url';
      }
      return undefined;
    });

    // Act
    const provider = msaNbCnbOrqServiceProvider as CustomProvider;
    const service = provider.useFactory(
      configService,
      httpService,
      kafkaService,
    );

    // Assert
    expect(service).toBeInstanceOf(RestMsaNbCnbOrqService);
  });

  it('should create RestMsaNbCnbOrqService when service type is undefined', () => {
    // Arrange
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'MSA_NB_CNB_ORQ_SERVICE_TYPE') {
        return undefined;
      }
      if (key === 'MSA_NB_CNB_ORQ_URL') {
        return 'http://test-url';
      }
      return undefined;
    });

    // Act
    const provider = msaNbCnbOrqServiceProvider as CustomProvider;
    const service = provider.useFactory(
      configService,
      httpService,
      kafkaService,
    );

    // Assert
    expect(service).toBeInstanceOf(RestMsaNbCnbOrqService);
  });

  it('should have correct provider token', () => {
    // Assert
    const provider = msaNbCnbOrqServiceProvider as CustomProvider;
    expect(provider.provide).toBe(MSA_NB_CNB_ORQ_SERVICE);
  });

  it('should inject correct dependencies', () => {
    // Assert
    const provider = msaNbCnbOrqServiceProvider as CustomProvider;
    expect(provider.inject).toEqual([ConfigService, HttpService, KafkaService]);
  });
});
