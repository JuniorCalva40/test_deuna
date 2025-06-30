import { DocumentValidationResultStatus } from '../../domain/enums/document-validation.enum';

/**
 * DTO for the detailed response of document validation
 */
export class DocumentValidationDataResultDto {
  /**
   * Status of the document validation result
   */
  status: DocumentValidationResultStatus;

  /**
   * Time when the validation was processed
   */
  timestamp?: string;

  /**
   * Details of the processed document
   */
  documentDetails?: {
    /**
     * Document type
     */
    documentType?: string;

    /**
     * Issuing country of the document
     */
    country?: string;

    /**
     * Document number
     */
    documentNumber?: string;

    /**
     * Issuance date of the document
     */
    issueDate?: string;

    /**
     * Expiration date of the document
     */
    expirationDate?: string;
  };

  /**
   * Personal information of the document holder
   */
  personalInfo?: {
    /**
     * First name of the document holder
     */
    firstName?: string;

    /**
     * Last name of the document holder
     */
    lastName?: string;

    /**
     * Date of birth
     */
    dateOfBirth?: string;

    /**
     * Gender
     */
    gender?: string;
  };

  /**
   * Additional information related to the validation
   */
  additionalInfo?: Record<string, any>;

  /**
   * Descriptive message of the result
   */
  message?: string;

  /**
   * Confidence score of the result (0-100)
   */
  confidenceScore?: number;
}
