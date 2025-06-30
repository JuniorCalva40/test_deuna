import { Inject, Injectable } from '@nestjs/common';
import { CnbStateValidationDTO } from '../../../application/dto/cnb-state-validation-request.dto';
import {
  CNB_STATE_VALIDATION_STORAGE_PORT,
  CnbStateValidationStoragePort,
} from '../../ports/out/storage/cnb-state-validation-storage.port';

@Injectable()
export class GetCnbStateValidationUseCase {
  constructor(
    @Inject(CNB_STATE_VALIDATION_STORAGE_PORT)
    private readonly cnbStateStorage: CnbStateValidationStoragePort,
  ) {}
  async execute(id: string): Promise<CnbStateValidationDTO | null> {
    return this.cnbStateStorage.getCnbStateValidation(id);
  }
}
