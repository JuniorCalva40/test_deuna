import {
  DocumentValidationResultStatus,
  DocumentValidationStatus,
} from '../enums/document-validation.enum';
import { DocumentValidationType } from '../enums/document-validation-type.enum';

export class DniValidation {
  id?: string;
  trackingId: string;
  sessionId: string;
  requestId: string;
  scanReference: string;
  merchantIdScanReference: string;
  frontsideImage: string;
  backsideImage?: string;
  country: string;
  idType: DocumentValidationType;
  status: DocumentValidationStatus;
  resultStatus?: DocumentValidationResultStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<DniValidation>) {
    Object.assign(this, partial);
    this.status = partial.status || DocumentValidationStatus.PENDING;
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }
}
