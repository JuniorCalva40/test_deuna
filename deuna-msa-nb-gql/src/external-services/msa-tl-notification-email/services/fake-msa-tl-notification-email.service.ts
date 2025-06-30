import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { IMsaTlNotificationEmailService } from '../interfaces/msa-tl-notification-email-service.interface';
import { EmailNotificationDto } from '../dto/msa-tl-notification-email.dto';

@Injectable()
export class FakeMsaTlNotificationEmailService
  implements IMsaTlNotificationEmailService
{
  sendEmail(notification: EmailNotificationDto): Observable<void> {
    console.log('Fake email sent:', notification);
    return of(undefined);
  }
}
