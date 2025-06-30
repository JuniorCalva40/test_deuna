import { CnbStateValidationDTO } from '../../../../application/dto/cnb-state-validation-request.dto';

export const CNB_STATE_VALIDATION_STORAGE_PORT =
  'CNB_STATE_VALIDATION_STORAGE_PORT' as const;

export interface CnbStateValidationStoragePort {
  saveCnbStateValidation(
    id: string,
    data: CnbStateValidationDTO,
  ): Promise<void>;
  getCnbStateValidation(id: string): Promise<CnbStateValidationDTO | null>;
}
