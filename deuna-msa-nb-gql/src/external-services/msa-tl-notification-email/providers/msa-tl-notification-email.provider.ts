import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { RestMsaTlNotificationEmailService } from '../services/rest-msa-tl-notification-email.service';
import { FakeMsaTlNotificationEmailService } from '../services/fake-msa-tl-notification-email.service';

export const MSA_TL_NOTIFICATION_EMAIL_SERVICE =
  'MSA_TL_NOTIFICATION_EMAIL_SERVICE';

export const msaTlNotificationEmailServiceProvider: Provider = {
  provide: MSA_TL_NOTIFICATION_EMAIL_SERVICE,
  useFactory: (configService: ConfigService, kafkaClient: KafkaService) => {
    const serviceType = configService.get<string>(
      'MSA_TL_NOTIFICATION_EMAIL_SERVICE_TYPE',
    );

    if (serviceType === 'mock') {
      return new FakeMsaTlNotificationEmailService();
    }

    return new RestMsaTlNotificationEmailService(kafkaClient);
  },
  inject: [ConfigService, KafkaService],
};
