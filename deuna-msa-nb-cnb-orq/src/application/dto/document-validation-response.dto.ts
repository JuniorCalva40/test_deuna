import { DocumentValidationResultStatus } from '../../domain/enums/document-validation.enum';
import { DocumentValidationStatus } from '../../domain/enums/document-validation.enum';
import { BaseDocumentValidationDto } from './document-validation-start.dto';

export interface DocumentValidationStartResponse {
  timestamp: string;
  scanReference: string;
  type: string;
}

export interface DocumentValidationStartServiceResponse {
  statusValidation: string;
}

export interface DocumentValidationStatusResponse {
  status: DocumentValidationStatus;
  timestamp: string;
  scanReference: string;
}

export interface DocumentValidationDataResponse {
  status: DocumentValidationResultStatus;
}

export class BaseDocumentValidationResponseDto extends BaseDocumentValidationDto {
  scanReference: string;
  type: string;
}

export class DocumentValidationStatusDto extends BaseDocumentValidationResponseDto {}

export class DocumentValidationDataDto extends BaseDocumentValidationResponseDto {}
