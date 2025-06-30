import {
  CnbStateValidationDTO,
  CnbStateValidationResponseDTO,
} from '../../../../application/dto/cnb-state-validation-request.dto';

export const CNB_STATE_VALIDATION_PORT = 'CNB_STATE_VALIDATION_PORT' as const;
export interface CnbStateValidationServicePort {
  saveValidation(
    id: string,
    request: CnbStateValidationDTO,
  ): Promise<CnbStateValidationResponseDTO>;
  getValidation(
    id: string,
  ): Promise<CnbStateValidationDTO | CnbStateValidationResponseDTO>;
}
