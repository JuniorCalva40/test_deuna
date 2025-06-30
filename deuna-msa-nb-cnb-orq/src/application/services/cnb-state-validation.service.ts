import { Logger } from '@deuna/tl-logger-nd';
import {
  CnbStateValidationDTO,
  CnbStateValidationResponseDTO,
} from '../dto/cnb-state-validation-request.dto';
import { CnbStateValidationServicePort } from '../ports/in/services/cnb-state-validation.service.port';
import { SaveCnbStateValidationUseCase } from '../use-cases/cnb-state-validation/save-cnb-state-validation.use-case';
import {
  CNB_STATE_VALIDATION_STORAGE_PORT,
  CnbStateValidationStoragePort,
} from '../ports/out/storage/cnb-state-validation-storage.port';
import { Inject } from '@nestjs/common';
import { GetCnbStateValidationUseCase } from '../use-cases/cnb-state-validation/get-cnb-state-validation.use-case';

export class CnbStateValidationService
  implements CnbStateValidationServicePort
{
  private readonly saveCnbStateValidationUseCase: SaveCnbStateValidationUseCase;
  private readonly getCnbStateValidationUseCase: GetCnbStateValidationUseCase;
  constructor(
    private readonly logger: Logger,
    @Inject(CNB_STATE_VALIDATION_STORAGE_PORT)
    private readonly storagePort: CnbStateValidationStoragePort,
  ) {
    this.saveCnbStateValidationUseCase = new SaveCnbStateValidationUseCase(
      this.storagePort,
    );
    this.getCnbStateValidationUseCase = new GetCnbStateValidationUseCase(
      this.storagePort,
    );
  }
  async saveValidation(
    id: string,
    request: CnbStateValidationDTO,
  ): Promise<CnbStateValidationResponseDTO> {
    await this.saveCnbStateValidationUseCase.execute(id, request);
    return { identification: id };
  }

  async getValidation(
    id: string,
  ): Promise<CnbStateValidationDTO | CnbStateValidationResponseDTO> {
    const response = await this.getCnbStateValidationUseCase.execute(id);

    if (!response) {
      return {
        status: 'not_found',
        identification: id,
      } as CnbStateValidationResponseDTO;
    }
    return { ...response, status: 'found' } as CnbStateValidationDTO;
  }
}
