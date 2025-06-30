import { UseGuards } from '@nestjs/common';
import { Resolver, Context, Query } from '@nestjs/graphql';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { MonthlyCommissionSummaryResponse } from './dto/monthly-commission-summary-response.dto';
import { MonthlyCommissionSummaryService } from './services/monthly-commission-summary.service';

@Resolver()
export class MonthlyCommissionSummaryResolver {
  constructor(private readonly service: MonthlyCommissionSummaryService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetClientGuard)
  @Query(() => MonthlyCommissionSummaryResponse, {
    name: 'monthlyCommissionSummary',
  })
  async getMonthlyCommissionSummary(
    @Context() context,
  ): Promise<MonthlyCommissionSummaryResponse> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];
    if (!customerInfo) {
      throw new Error('Customer info is required, customer info is missing');
    }
    return this.service.getMonthlyCommissionSummary(customerInfo.id);
  }
}
