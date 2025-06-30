import { DocumentValidationStartDto } from '../../application/dto/document-validation-start.dto';
import {
  DocumentValidationStartResponse,
  DocumentValidationStatusResponse,
  DocumentValidationDataResponse,
} from '../../application/dto/document-validation-response.dto';

export interface DocumentValidationPort {
  startValidation(
    input: DocumentValidationStartDto,
  ): Promise<DocumentValidationStartResponse>;

  getValidationStatus(
    scanReference: string,
    trackingData: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationStatusResponse>;

  getValidationData(
    scanReference: string,
    trackingData: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationDataResponse>;
}
