export const SERVICE_NAME = 'nb-cnb-orq';
export const SERVICE_DESCRIPTION =
  'The service is responsible for the consume of transactions';

export enum functionalities {}

export class TrackingInfoDto {
  sessionId: string;
  trackingId: string;
  requestId: string;
}
