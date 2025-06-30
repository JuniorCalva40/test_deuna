import { DocumentValidationStartDto } from '../../../dto/document-validation-start.dto';
import {
  DocumentValidationStartResponse,
  DocumentValidationStatusResponse,
} from '../../../dto/document-validation-response.dto';
import { DocumentValidationDataResultDto } from '../../../dto/document-validation-data-result.dto';

export const DOCUMENT_VALIDATION_CLIENT_PORT = 'DocumentValidationClientPort';

export interface DocumentValidationClientPort {
  startValidation(
    input:
      | Omit<DocumentValidationStartDto, 'onboardingSessionId'>
      | DocumentValidationStartDto,
  ): Promise<DocumentValidationStartResponse>;

  getValidationStatus(
    scanReference: string,
    trackingData: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationStatusResponse>;

  getValidationData(
    scanReference: string,
    trackingData: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationDataResultDto>;
}
