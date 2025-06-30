import { Inject, Injectable } from '@nestjs/common';
import { endpoints } from '../../constants/api';
import { MAMBU_CLIENT } from '../../constants/constants';
import { MambuRestService } from '../../mambu-rest.service';
import { MambuOptions } from '../../mambu.types';
import { LogMambu } from '../../utils/mambu-logger';
import {
  GLAccountCreateJornalEntryRQ,
  GLAccountCreateJornalEntryRS,
} from './gl-account.types';

@Injectable()
export class GLAccountService {
  constructor(
    @Inject(MAMBU_CLIENT)
    private options: MambuOptions,
    private mambuRestService: MambuRestService,
  ) {}

  @LogMambu()
  async createJournalEnty(
    createJournalEnty: GLAccountCreateJornalEntryRQ,
  ): Promise<GLAccountCreateJornalEntryRS[]> {
    const url = `${this.options.domain}/${endpoints.gljournalentries}`;
    return await this.mambuRestService.post<GLAccountCreateJornalEntryRS[]>(
      url,
      createJournalEnty,
    );
  }
}
