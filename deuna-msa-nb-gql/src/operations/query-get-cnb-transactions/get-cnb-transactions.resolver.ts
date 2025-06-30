import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Context, Query } from '@nestjs/graphql';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { GetCnbTransactionsResponse } from './dto/get-cnb-transactions-response.dto';
import { GetCnbTransactionsInput } from './dto/get-cnb-transactions-input.dto';
import { ClientInfo } from '../../core/schema/merchat-client.schema';

import { GetCnbTransactionsService } from './services/get-cnb-transactions.service';

@Resolver()
export class GetCnbTransactionsResolver {
  constructor(private readonly service: GetCnbTransactionsService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetClientGuard)
  @Query(() => GetCnbTransactionsResponse, {
    name: 'cnbTransactions',
  })
  async getCnbTransactions(
    @Args('input') input: GetCnbTransactionsInput,
    @Context() context,
  ): Promise<GetCnbTransactionsResponse> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    if (!customerInfo) {
      throw new Error('Customer info is required, customer info is missing');
    }
    return this.service.getCnbTransactions(input, customerInfo.id);
  }
}
