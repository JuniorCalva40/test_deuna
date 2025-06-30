import { DocumentValidationStartDto } from '../../dto/document-validation-start.dto';
import {
  DocumentValidationStartServiceResponse,
  DocumentValidationStatusResponse,
  DocumentValidationDataResponse,
} from '../../dto/document-validation-response.dto';
import { DocumentValidationDataResultDto } from '../../dto/document-validation-data-result.dto';

export const DOCUMENT_VALIDATION_PORT = 'DocumentValidationPort';

// Transforming the interface into a partial interface to allow flexible implementations
export interface KycDocumentValidationPort {
  startValidation(
    input: DocumentValidationStartDto,
  ): Promise<DocumentValidationStartServiceResponse>;

  // These methods are optional with Partial<>
  getValidationStatus?(
    scanReference: string,
    trackingInfo: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationStatusResponse>;

  getValidationData?(
    scanReference: string,
    trackingInfo: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationDataResponse>;

  processDocumentValidationMessage(
    message: any,
    trackingInfo: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<{
    retry?: boolean;
    status?: string;
    message?: any;
    data?: DocumentValidationDataResultDto;
  }>;
}
