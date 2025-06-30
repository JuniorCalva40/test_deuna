import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { IMsaTlNotificationEmailService } from '../interfaces/msa-tl-notification-email-service.interface';
import { EmailNotificationDto } from '../dto/msa-tl-notification-email.dto';
import {
  NotificationData,
  NotificationType,
  MailNotification,
  NOTIFICATION_EMAIL_SEND_TOPIC,
} from '@deuna/tl-common-nd';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RestMsaTlNotificationEmailService
  implements IMsaTlNotificationEmailService, OnModuleInit
{
  private readonly logger = new Logger(RestMsaTlNotificationEmailService.name);

  constructor(private readonly kafkaService: KafkaService) {}

  async onModuleInit() {
    // No need to explicitly connect to Kafka as KafkaService handles this
  }

  sendEmail(notification: EmailNotificationDto): Observable<void> {
    const trackingId = uuidv4();

    const mail: MailNotification = {
      to: notification.to,
      subject: notification.subject,
      body: notification.body,
      attachments: notification.attachments,
    };

    const emailNotification: NotificationData = {
      type: NotificationType.MAIL,
      trackingId: trackingId,
      mail: mail,
    };

    return from(
      this.publishNotification(
        emailNotification,
        NOTIFICATION_EMAIL_SEND_TOPIC,
      ),
    );
  }

  private async publishNotification(
    dataNotification: NotificationData,
    topic: string,
  ): Promise<void> {
    this.logger.log(
      `Sending notification payload ${JSON.stringify(dataNotification)} with topic ${topic}`,
    );

    await this.kafkaService.publishToQueue({
      topic: topic,
      headers: {
        source: 'leap-x/nb-gql-email',
        timestamp: new Date().toISOString(),
      },
      value: dataNotification,
    });

    this.logger.log(
      `Sent notification payload ${JSON.stringify(dataNotification)} with topic ${topic}`,
    );
  }
}
