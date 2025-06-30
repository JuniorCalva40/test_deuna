import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';

export const getKafkaClientConfig = (
  configService: ConfigService,
  groupId: string = 'nb-orq-cnb-orq-service',
): KafkaOptions => ({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'nb-orq-transaction-service',
      enforceRequestTimeout: false,
      retry: {
        initialRetryTime: 100,
        retries: 100,
      },
      brokers: configService.get<string>('KAFKA_URLS', '').split(','),
      ...(configService.get<string>('KAFKA_SSL_ENABLED') === 'true'
        ? {
            ssl: true,
            sasl: {
              mechanism: 'scram-sha-512',
              username: configService.get<string>('KAFKA_SASL_USERNAME'),
              password: configService.get<string>('KAFKA_SASL_PASSWORD'),
            },
          }
        : {}),
    },
    consumer: {
      groupId,
      rebalanceTimeout: 60000,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 5000,
      allowAutoTopicCreation: true,
    },
    subscribe: {
      fromBeginning: true,
    },
  },
});
