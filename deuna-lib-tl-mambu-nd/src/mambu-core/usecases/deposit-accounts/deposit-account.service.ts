import { Inject, Injectable } from '@nestjs/common';
import { DetailsLevel, FilterCriteria, Pagination, PaginationDetails } from '../../config/fields/search-params.type';
import { actions, ACTIONS, endpoints } from '../../constants/api';
import { MAMBU_CLIENT } from '../../constants/constants';
import { MambuRestService } from '../../mambu-rest.service';
import { EditionField, MambuOptions } from '../../mambu.types';
import { MambuDateUtils } from '../../utils/mambu-date.utils';
import { LogMambu } from '../../utils/mambu-logger';
import {
  ApplyInterest,
  ChangeInterestRate,
  ChangeStatus,
  DepositAccount,
} from './deposit-account.types';

@Injectable()
export class DepositAccountService {
  constructor(
    @Inject(MAMBU_CLIENT)
    private options: MambuOptions,
    private mambuRestService: MambuRestService,
  ) {}

  @LogMambu()
  async fetchById(
    accountId: string,
    detailsLevel: DetailsLevel = DetailsLevel.BASIC,
  ): Promise<DepositAccount> {
    return await this.mambuRestService.get<DepositAccount>(
      `${this.options.domain}/${endpoints.deposits}/${accountId}`,
      {
        params: { detailsLevel },
      },
    );
  }

  @LogMambu()
  async changeState(changeStatus: ChangeStatus): Promise<void> {
    const { accountId, action, notes } = changeStatus;
    await this.mambuRestService.post(
      `${this.options.domain}/${endpoints.deposits}/${accountId}:${ACTIONS.ACCOUNTS.changeState}`,
      {
        action,
        notes,
      },
    );
  }

  @LogMambu()
  async applyInterest(applyInterest: ApplyInterest): Promise<void> {
    const { accountId, interestApplicationDate, notes } = applyInterest;
    await this.mambuRestService.post(
      `${this.options.domain}/${endpoints.deposits}/${accountId}:${ACTIONS.ACCOUNTS.applyInterest}`,
      {
        interestApplicationDate: MambuDateUtils.formatISODate(
          interestApplicationDate,
        ),
        notes,
      },
    );
  }

  @LogMambu()
  async changeInterestRate(
    changeInterestRate: ChangeInterestRate,
  ): Promise<void> {
    const { accountId, interestRate, valueDate, notes } = changeInterestRate;
    await this.mambuRestService.post(
      `${this.options.domain}/${endpoints.deposits}/${accountId}:${ACTIONS.ACCOUNTS.changeInterestRate}`,
      {
        interestRate,
        valueDate: MambuDateUtils.formatValueDate(valueDate),
        notes,
      },
    );
  }

  @LogMambu()
  async update(accountId: string, fields: EditionField<any>[]): Promise<void> {
    await this.mambuRestService.patch(
      `${this.options.domain}/${endpoints.deposits}/${accountId}`,
      fields,
    );
  }

  @LogMambu()
  async search(
    filterCriteria?: FilterCriteria,
    pagination?: Pagination,
    detailsLevel: DetailsLevel = DetailsLevel.BASIC,
  ): Promise<{ data: DepositAccount[]; paginationDetails: PaginationDetails }> {
    const url = `${this.options.domain}/${endpoints.deposits}:${actions.search}`;
    return await this.mambuRestService.search<DepositAccount[]>(
      url,
      filterCriteria,
      {
        params: {
          detailsLevel,
          offset: pagination?.offset,
          limit: pagination?.limit,
          paginationDetails: pagination?.paginationDetails,
        },
      },
    );
  }
}
