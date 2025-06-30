import { Injectable } from '@nestjs/common';
import { MambuOps } from '../../../../../mambu-core/mambu.types';
import { ClientFields } from '../../../../../mambu-core/usecases/clients/client.constants';
import { ClientService } from '../../../../../mambu-core/usecases/clients/client.service';
import { UpdateName } from './deuna-clients-update.types';
import { LogDeunaMambu } from '../../../../utils/deuna-mambu-logger';

@Injectable()
export class DeunaClientUpdateService {
  constructor(private clientService: ClientService) {}

  @LogDeunaMambu()
  async updateName(updateName: UpdateName): Promise<void> {
    const { clientId, fistName, lastName } = updateName;
    return await this.clientService.update(clientId, [
      {
        op: MambuOps.ADD,
        path: ClientFields.FIRST_NAME,
        value: fistName,
      },
      {
        op: MambuOps.ADD,
        path: ClientFields.LAST_NAME,
        value: lastName,
      },
    ]);
  }
}
