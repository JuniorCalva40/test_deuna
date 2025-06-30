import { Observable } from 'rxjs';
import { EmailNotificationDto } from '../dto/msa-tl-notification-email.dto';

export interface IMsaTlNotificationEmailService {
  sendEmail(notification: EmailNotificationDto): Observable<void>;
}
