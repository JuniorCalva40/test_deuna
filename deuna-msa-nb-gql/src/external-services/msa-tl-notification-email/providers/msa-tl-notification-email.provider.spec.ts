import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@deuna/tl-kafka-nd';
import {
  MSA_TL_NOTIFICATION_EMAIL_SERVICE,
  msaTlNotificationEmailServiceProvider,
} from './msa-tl-notification-email.provider';
import { RestMsaTlNotificationEmailService } from '../services/rest-msa-tl-notification-email.service';
import { FakeMsaTlNotificationEmailService } from '../services/fake-msa-tl-notification-email.service';

describe('msaTlNotificationEmailServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let kafkaService: jest.Mocked<KafkaService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    kafkaService = {} as any;
  });

  it('should provide RestMsaTlNotificationEmailService when MSA_TL_NOTIFICATION_EMAIL_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlNotificationEmailServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: KafkaService, useValue: kafkaService },
      ],
    }).compile();

    const service = module.get(MSA_TL_NOTIFICATION_EMAIL_SERVICE);
    expect(service).toBeInstanceOf(RestMsaTlNotificationEmailService);
  });

  it('should provide FakeMsaTlNotificationEmailService when MSA_TL_NOTIFICATION_EMAIL_SERVICE_TYPE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlNotificationEmailServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: KafkaService, useValue: kafkaService },
      ],
    }).compile();

    const service = module.get(MSA_TL_NOTIFICATION_EMAIL_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaTlNotificationEmailService);
  });

  it('should provide RestMsaTlNotificationEmailService when MSA_TL_NOTIFICATION_EMAIL_SERVICE_TYPE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlNotificationEmailServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: KafkaService, useValue: kafkaService },
      ],
    }).compile();

    const service = module.get(MSA_TL_NOTIFICATION_EMAIL_SERVICE);
    expect(service).toBeInstanceOf(RestMsaTlNotificationEmailService);
  });

  it('should inject ConfigService and KafkaService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlNotificationEmailServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: KafkaService, useValue: kafkaService },
      ],
    }).compile();

    const service = module.get(MSA_TL_NOTIFICATION_EMAIL_SERVICE);
    expect(service).toBeInstanceOf(RestMsaTlNotificationEmailService);
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_TL_NOTIFICATION_EMAIL_SERVICE_TYPE',
    );
  });
});
