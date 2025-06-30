/**
 * Data of the digital signature service response for successful responses
 */
export interface DigitalSignatureResponseData {
  /**
   * Response message from the service
   */
  response: string;

  /**
   * Generated transaction identifier
   */
  referenceTransaction: string;
}

/**
 * Specific data of the error returned by the external service
 */
export interface DigitalSignatureErrorResponseData {
  /**
   * HTTP error code
   */
  code: number;

  /**
   * Error message
   */
  message: string;

  /**
   * Error indicator
   */
  error: boolean;
}

/**
 * Complete data of the error
 */
export interface DigitalSignatureErrorData {
  /**
   * Specific error code
   */
  errorCode: string;

  /**
   * Endpoint that generated the error
   */
  endpoint: string;

  /**
   * Response data of the error
   */
  responseData: DigitalSignatureErrorResponseData;
}

/**
 * Base interface for all digital signature service responses
 */
export interface DigitalSignatureResponseBase {
  /**
   * Response status
   */
  status: 'success' | 'error';

  /**
   * Descriptive message
   */
  message: string;

  /**
   * Reference identifier (present in some versions of the API)
   */
  referenceId?: string;
}

/**
 * Successful response from the digital signature service
 */
export interface DigitalSignatureSuccessResponse
  extends DigitalSignatureResponseBase {
  /**
   * Success status
   */
  status: 'success';

  /**
   * Data of the successful response
   */
  data: DigitalSignatureResponseData;

  /**
   * Transaction identifier (can be in the root or within data)
   */
  referenceTransaction?: string;
}

/**
 * Error response from the digital signature service
 */
export interface DigitalSignatureErrorResponse
  extends DigitalSignatureResponseBase {
  /**
   * Error status
   */
  status: 'error';

  /**
   * Detailed error data
   */
  data: DigitalSignatureErrorData;
}

/**
 * Union type for all possible service responses
 */
export type DigitalSignatureResponse =
  | DigitalSignatureSuccessResponse
  | DigitalSignatureErrorResponse;
