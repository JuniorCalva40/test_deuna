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
import { MambuOptions } from '../../mambu.types';
import { Transaction, TransactionTransfer } from './deposit-transaction.types';
import { isDeposit } from './deposit-transaction.utils';
import { LogDeunaMambu } from '../../../mambu-deuna/utils/deuna-mambu-logger';
import { generateSecureRandomNumber } from '../../utils/mambu-common.utils';

const { v4: uuidv4 } = require('uuid');

@Injectable()
export class DepositTransactionService {
  constructor(
    @Inject(MAMBU_CLIENT)
    private options: MambuOptions,
    private mambuRestService: MambuRestService,
  ) { }

  @LogDeunaMambu()
  async getById(
    id: string,
    detailsLevel: DetailsLevel = DetailsLevel.BASIC,
  ): Promise<Transaction> {
    const url = `${this.options.domain}/${endpoints.deposits}/${endpoints.transactions}/${id}`;
    return await this.mambuRestService.get<Transaction>(url, {
      params: { detailsLevel },
    });
  }

  @LogDeunaMambu()
  async search(
    filterCriteria?: FilterCriteria,
    pagination?: Pagination,
    detailsLevel: DetailsLevel = DetailsLevel.BASIC,
  ): Promise<{ data: Transaction[]; paginationDetails: PaginationDetails }> {
    const url = `${this.options.domain}/${endpoints.deposits}/${endpoints.transactions}:${actions.search}`;
    return await this.mambuRestService.search<Transaction[]>(
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

  @LogDeunaMambu()
  async makeTransaction(
    transaction: TransactionTransfer,
  ): Promise<Transaction> {
    const { parentAccountKey } = transaction;

    const action = isDeposit(transaction)
      ? actions.deposit
      : actions.withdrawal;

    const url = `${this.options.domain}/${endpoints.deposits}/${parentAccountKey}/${action}-${endpoints.transactions}`;

    transaction.paymentOrderId = generateSecureRandomNumber();
    transaction.externalId = uuidv4();

    return await this.mambuRestService.post<Transaction>(url, transaction);
  }
}
