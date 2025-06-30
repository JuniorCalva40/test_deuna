import { DniValidation } from '../entities/dni-validation.entity';

/**
 * Port for the document validation repository
 */
export interface DocumentValidationRepositoryPort {
  save(dniValidation: DniValidation): Promise<DniValidation>;
  findByScanReference(scanReference: string): Promise<DniValidation | null>;
  updateStatus(
    scanReference: string,
    status: string,
    resultStatus?: string,
  ): Promise<DniValidation>;
}
