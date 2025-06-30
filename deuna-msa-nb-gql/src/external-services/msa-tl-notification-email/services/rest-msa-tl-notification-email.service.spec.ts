import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { RestMsaTlNotificationEmailService } from './rest-msa-tl-notification-email.service';
import { EmailNotificationDto } from '../dto/msa-tl-notification-email.dto';

describe('RestMsaTlNotificationEmailService', () => {
  let service: RestMsaTlNotificationEmailService;
  let kafkaService: jest.Mocked<KafkaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaTlNotificationEmailService,
        {
          provide: KafkaService,
          useValue: {
            publishToQueue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaTlNotificationEmailService>(
      RestMsaTlNotificationEmailService,
    );
    kafkaService = module.get(KafkaService) as jest.Mocked<KafkaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    const mockNotification: EmailNotificationDto = {
      to: ['test@example.com'],
      subject: 'Test Subject',
      body: '<html><body>Test Body</body></html>',
    };

    it('should send email successfully', (done) => {
      kafkaService.publishToQueue.mockResolvedValue(undefined);

      service.sendEmail(mockNotification).subscribe({
        next: () => {
          expect(kafkaService.publishToQueue).toHaveBeenCalled();
          done();
        },
        error: done,
      });
    });

    it('should handle errors', (done) => {
      kafkaService.publishToQueue.mockRejectedValue(new Error('Kafka error'));

      service.sendEmail(mockNotification).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Kafka error');
          done();
        },
      });
    });
  });
});
