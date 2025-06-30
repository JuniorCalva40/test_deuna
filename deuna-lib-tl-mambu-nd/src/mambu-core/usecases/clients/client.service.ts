import { Inject, Injectable } from '@nestjs/common';
import {
  DetailsLevel,
  FilterCriteria,
  Pagination,
  PaginationDetails,
} from '../../config/fields/search-params.type';
import { actions, endpoints } from '../../constants/api';
import { MAMBU_CLIENT } from '../../constants/constants';
import { MambuRestService } from '../../mambu-rest.service';
import { EditionField, MambuOptions } from '../../mambu.types';
import { LogMambu } from '../../utils/mambu-logger';
import { Client } from './client.types';
import { DepositAccountService } from '../deposit-accounts/deposit-account.service';

@Injectable()
export class ClientService {
  constructor(
    @Inject(MAMBU_CLIENT)
    private options: MambuOptions,
    private mambuRestService: MambuRestService,
    private depositAccountService: DepositAccountService
  ) { }

  @LogMambu()
  async findById(
    clientId: string,
    detailsLevel: DetailsLevel = DetailsLevel.BASIC,
  ): Promise<Client> {
    const url = `${this.options.domain}/${endpoints.clients}/${clientId}`;
    return await this.mambuRestService.get<Client>(url, {
      params: { detailsLevel },
    });
  }

  @LogMambu()
  async findByAccountId(
    accountId: string,
    detailsLevel: DetailsLevel = DetailsLevel.BASIC,
  ): Promise<Client> {
    const account = await this.depositAccountService.fetchById(accountId, detailsLevel,)
    const url = `${this.options.domain}/${endpoints.clients}/${account.accountHolderKey}`;

    return await this.mambuRestService.get<Client>(url, {
      params: { detailsLevel },
    });
  }

  @LogMambu()
  async search(
    filterCriteria?: FilterCriteria,
    pagination?: Pagination,
    detailsLevel: DetailsLevel = DetailsLevel.BASIC,
  ): Promise<{ data: Client[]; paginationDetails: PaginationDetails }> {
    const url = `${this.options.domain}/${endpoints.clients}:${actions.search}`;
    return await this.mambuRestService.search<Client[]>(url, filterCriteria, {
      params: {
        detailsLevel,
        offset: pagination?.offset,
        limit: pagination?.limit,
        paginationDetails: pagination?.paginationDetails,
      },
    });
  }

  @LogMambu()
  async update(clientId: string, fields: EditionField<any>[]): Promise<void> {
    await this.mambuRestService.patch(
      `${this.options.domain}/${endpoints.clients}/${clientId}`,
      fields,
    );
  }
}
