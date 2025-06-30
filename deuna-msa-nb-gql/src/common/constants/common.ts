export const SERVICE_NAME = process.env.SERVICE_NAME || 'msa-nb-gql';

export enum StatusRecoveryUser {
  ACTIVE = 'ACTIVE',
  BLOCK = 'BLOCK',
  RECOVERY = 'RECOVERY',
  RECOVERY_SUCCESS = 'RECOVERY_SUCCESS',
  RECOVERY_FAILURE = 'RECOVERY_FAILURE',
}

export enum BankName {
  DEUNA = 'DEUNA',
  BANCOPICHINCHA = 'BANCOPICHINCHA',
}

export enum Rating {
  ZERO = 0,
  TWO = 2,
  FOUR = 4,
}

export enum SenderDocType {
  CC = 'CC',
}

export enum PreApprovedState {
  TO_COMPLETE = 'TO_COMPLETE',
  REMAINING = 'REMAINING',
  CONTINUE = 'CONTINUE',
  APPROVED = 'APPROVED',
  INACTIVE = 'INACTIVE',
  REVIEW = 'REVIEW',
  BLOCKED_TMP = 'BLOCKED_TMP',
  BLOCKED_PERMANENT = 'BLOCKED_PERMANENT',
}

export enum CnbState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum DocumentValidationType {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  VISA = 'VISA',
}

export enum DocumentValidationStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export enum DocumentValidationResultStatus {
  APPROVED_VERIFIED = 'APPROVED_VERIFIED',
  DENIED_FRAUD = 'DENIED_FRAUD',
  DENIED_UNSUPPORTED_ID_TYPE = 'DENIED_UNSUPPORTED_ID_TYPE',
  DENIED_UNSUPPORTED_ID_COUNTRY = 'DENIED_UNSUPPORTED_ID_COUNTRY',
  ERROR_NOT_READABLE_ID = 'ERROR_NOT_READABLE_ID',
  NO_ID_UPLOADED = 'NO_ID_UPLOADED',
}

export class TrackingBaseDto {
  sessionId: string;
  trackingId: string;
  requestId: string;
}

export enum TrackingApiHeaders {
  USER_ID = 'x-user-id',
  SESSION_ID = 'x-session-id',
  REQUEST_ID = 'x-request-id',
  TRACKING_ID = 'x-tracking-id',
}

export interface TrackingHeaders {
  [TrackingApiHeaders.SESSION_ID]: string;
  [TrackingApiHeaders.REQUEST_ID]: string;
  [TrackingApiHeaders.TRACKING_ID]: string;
  [key: string]: string;
}

export enum ValidationMethods {
  FACIAL_RECOGNITION = 1,
  OTP_AUTHENTICATION = 2,
}

export enum CivilRegistryOperationType {
  FACIAL = 'FACIAL',
  DATA = 'DATA',
  FULL = 'FULL',
}

export enum PlatformType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

export const DEPOSIT_REASON = 'Debito deuna cnb';

export enum TransactionChannelId {
  INTTRANFERRETIROCNBS = 'INTTRANFERRETIROCNBS',
  INTTRANFERRETIROCNBSCOM = 'INTTRANFERRETIROCNBSCOM',
  INTTRANFERRETIROCNBSTAX = 'INTTRANFERRETIROCNBSTAX',
  INTTRANFERDEPOSITOCNBS = 'INTTRANFERDEPOSITOCNBS',
}

export enum TransactionChannelType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

export const PAGINATION_COMMISSION_DTO = {
  page: 1,
  size: 10,
} as const;
