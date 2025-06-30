export const SERVICE_NAME = process.env.SERVICE_NAME || 'msa-nb-gql';

export enum StatusRecoveryUser {
  ACTIVE = 'ACTIVE',
  BLOCK = 'BLOCK',
  RECOVERY = 'RECOVERY',
  RECOVERY_SUCCESS = 'RECOVERY_SUCCESS',
  RECOVERY_FAILURE = 'RECOVERY_FAILURE',
}
