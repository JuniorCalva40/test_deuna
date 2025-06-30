export enum MambuAcceptHeader {
  ACCEPT_V2 = 'application/vnd.mambu.v2+json',
}

export enum MambuOps {
  ADD = 'ADD',
  REPLACE = 'REPLACE',
}

/**
 * Enum for criteria operators used in search filters.
 */
export enum CriteriaOperator {
  /**
   * @deprecated This have performance issues, use EQUALS_CASE_SENSITIVE instead. This operator is deprecated not recommended for use and will be delete in the next version.
   * Affected values: ONE_VALUE, Available for: BIG_DECIMAL, BOOLEAN, LONG, MONEY, NUMBER, PERCENT, STRING, ENUM, KEY
   */
  EQUALS = 'EQUALS',
  /** Affected values: ONE_VALUE, Available for: STRING, BOOLEAN, DATE, NUMBER, ENUM, KEY */
  EQUALS_CASE_SENSITIVE = 'EQUALS_CASE_SENSITIVE',
  /** Affected values: ONE_VALUE, Available for: BIG_DECIMAL, NUMBER, MONEY */
  MORE_THAN = 'MORE_THAN',
  /** Affected values: ONE_VALUE, Available for: BIG_DECIMAL, NUMBER, MONEY */
  LESS_THAN = 'LESS_THAN',
  /** Affected values: TWO_VALUES, Available for: BIG_DECIMAL, NUMBER, MONEY, DATE, DATE_TIME */
  BETWEEN = 'BETWEEN',
  /** Affected values: ONE_VALUE, Available for: DATE, DATE_TIME */
  ON = 'ON',
  /** Affected values: ONE_VALUE, Available for: DATE, DATE_TIME */
  AFTER = 'AFTER',
  /** Affected values: ONE_VALUE, Available for: DATE, DATE_TIME */
  BEFORE = 'BEFORE',
  /** Affected values: ONE_VALUE, Available for: DATE, DATE_TIME */
  BEFORE_INCLUSIVE = 'BEFORE_INCLUSIVE',
  /** Affected values: ONE_VALUE, Available for: STRING */
  STARTS_WITH = 'STARTS_WITH',
  /** Affected values: ONE_VALUE, Available for: STRING */
  STARTS_WITH_CASE_SENSITIVE = 'STARTS_WITH_CASE_SENSITIVE',
  /** Affected values: LIST, Available for: ENUM, KEY */
  IN = 'IN',
  /** Affected values: NO_VALUE, Available for: DATE, DATE_TIME */
  TODAY = 'TODAY',
  /** Affected values: NO_VALUE, Available for: DATE, DATE_TIME */
  THIS_WEEK = 'THIS_WEEK',
  /** Affected values: NO_VALUE, Available for: DATE, DATE_TIME */
  THIS_MONTH = 'THIS_MONTH',
  /** Affected values: NO_VALUE, Available for: DATE, DATE_TIME */
  THIS_YEAR = 'THIS_YEAR',
  /** Affected values: ONE_VALUE, Available for: NUMBER */
  LAST_DAYS = 'LAST_DAYS',
  /** Affected values: NO_VALUE, Available for: BIG_DECIMAL, LONG, MONEY, NUMBER, PERCENT, STRING, ENUM, KEY, DATE, DATE_TIME */
  EMPTY = 'EMPTY',
  /** Affected values: NO_VALUE, Available for: BIG_DECIMAL, LONG, MONEY, NUMBER, PERCENT, STRING, ENUM, KEY, DATE, DATE_TIME */
  NOT_EMPTY = 'NOT_EMPTY',
}

export interface MambuOptions {
  context: string;
  domain: string;
}

export interface MambuApiKeyAuthOptions extends MambuOptions {
  apikey: string;
}

export interface MambuBasiAuthOptions extends MambuOptions {
  user: string;
  password: string;
}

export interface MambuErrors {
  errors: MambuError[];
}

export interface MambuError {
  errorReason?: string;
  errorCode?: number;
  errorSource: string;
}

export class EditionField<T> {
  op: MambuOps;
  path: string;
  value: T;
}
