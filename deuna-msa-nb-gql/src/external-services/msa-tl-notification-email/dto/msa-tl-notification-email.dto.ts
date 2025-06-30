export class EmailNotificationDto {
  to: string[];
  subject: string;
  body: string;
  attachments?: {
    fileName: string;
    contentType: string;
    url: string;
  }[];
}
