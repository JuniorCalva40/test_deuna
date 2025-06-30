import { Injectable } from '@nestjs/common';
import { GLAccountService } from '../../../mambu-core/usecases/gl-accounts/gl-account.service';
import { GLAccountUtils } from '../../../mambu-core/usecases/gl-accounts/gl-account.utils';
import { MambuDateUtils } from '../../../mambu-core/utils/mambu-date.utils';
import { LogDeunaMambu } from '../../utils/deuna-mambu-logger';
import {
  GLAccountMovementRQ,
  GLAccountMovementRS,
} from './deuna-gl-account.types';

@Injectable()
export class DeunaGLAccountService {
  constructor(private glAccountService: GLAccountService) {}

  @LogDeunaMambu()
  async createJournarEntry(
    glAccountMovement: GLAccountMovementRQ,
  ): Promise<GLAccountMovementRS> {
    const { amount, beneficiary, origin, branch, notes, date } =
      glAccountMovement;
    const createJournalEntyRS = await this.glAccountService.createJournalEnty({
      branchId: branch?.id,
      debits: [
        {
          amount,
          glAccount: origin.glAccount.id,
        },
      ],
      credits: [
        {
          amount,
          glAccount: beneficiary.glAccount.id,
        },
      ],
      date: MambuDateUtils.formatISODate(date ?? new Date()),
      notes,
    });
    return {
      origin: GLAccountUtils.findDebit(createJournalEntyRS),
      beneficiary: GLAccountUtils.findCredit(createJournalEntyRS),
    };
  }
}
