import { Injectable } from '@nestjs/common';
import {
  Criteria,
  DetailsLevel,
  EnablePaginationDetails,
  FilterCriteria,
  Pagination,
} from '../../../mambu-core/config/fields/search-params.type';
import { CriteriaOperator, MambuOps } from '../../../mambu-core/mambu.types';
import { ClientFields } from '../../../mambu-core/usecases/clients/client.constants';
import { ClientService } from '../../../mambu-core/usecases/clients/client.service';
import { CUSTOM_FIELDS } from '../../config/custom-fields/custom-fields.types';
import { LogDeunaMambu } from '../../utils/deuna-mambu-logger';
import { ClientChangeBranch, ClientCustom } from './deuna-clients.types';

@Injectable()
export class DeunaClientsService {
  constructor(private clientService: ClientService) { }

  @LogDeunaMambu()
  async findById(
    id: string,
    detailsLevel: DetailsLevel = DetailsLevel.FULL,
  ): Promise<ClientCustom> {
    return (await this.clientService.findById(
      id,
      detailsLevel,
    )) as ClientCustom;
  }

  @LogDeunaMambu()
  async searchByCenterOfCosts(centerOfCost: string) {
    const { section, customFields } = CUSTOM_FIELDS.CLIENTS.centerOfCosts;
    return await this.searchRecentClients([
      {
        field: `${section}.${customFields.id}`,
        operator: CriteriaOperator.EQUALS_CASE_SENSITIVE,
        value: centerOfCost,
      },
    ]);
  }

  @LogDeunaMambu()
  async searchByCenterOfCostsAsNull() {
    const { section, customFields } = CUSTOM_FIELDS.CLIENTS.centerOfCosts;
    return await this.searchRecentClients([
      {
        field: `${section}.${customFields.id}`,
        operator: CriteriaOperator.EMPTY,
      },
    ]);
  }

  @LogDeunaMambu()
  async updateCenterOfCosts(clientId: string, centerOfCost: string) {
    const customField = CUSTOM_FIELDS.CLIENTS.centerOfCosts;
    await this.clientService.update(clientId, [
      {
        op: MambuOps.ADD,
        path: customField.section,
        value: {
          _client_anchorage_id: centerOfCost,
        },
      },
    ]);
  }

  @LogDeunaMambu()
  private async searchRecentClients(criteria: Criteria[]) {
    return await this.search(
      {
        filterCriteria: [
          ...criteria,
          {
            field: ClientFields.CLIENT_ROLE_KEY,
            operator: CriteriaOperator.EQUALS_CASE_SENSITIVE,
            value: process.env.CLIENT_ROLE_KEY,
          },
          {
            field: ClientFields.CREATION_DATE,
            operator: CriteriaOperator.LAST_DAYS,
            value: '3',
          },
        ],
      },
      {
        offset: 0,
        limit: 50,
        paginationDetails: EnablePaginationDetails.OFF,
      },
    );
  }

  @LogDeunaMambu()
  async search(
    filterCriteria?: FilterCriteria,
    pagination?: Pagination,
    detailsLevel: DetailsLevel = DetailsLevel.BASIC,
  ) {
    return this.clientService.search(
      filterCriteria,
      pagination,
      detailsLevel,
    ) as unknown as ClientCustom[];
  }

  @LogDeunaMambu()
  async changeBranchCenter(
    clientChangeBranch: ClientChangeBranch,
  ): Promise<void> {
    const { clientId, branchId, centerId } = clientChangeBranch;
    return await this.clientService.update(clientId, [
      {
        op: MambuOps.ADD,
        path: ClientFields.ASSIGNED_BRANCH_KEY,
        value: branchId,
      },
      {
        op: MambuOps.ADD,
        path: ClientFields.ASSIGNED_CENTER_KEY,
        value: centerId,
      },
    ]);
  }
}
