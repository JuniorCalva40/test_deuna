import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AcceptBillingService } from './services/accept-billing.service';
import { AcceptBillingResponse } from './dto/accept-billing-response.dto';
import { AcceptBillingInput } from './dto/accept-billing-input.dto';

@Resolver()
export class AcceptBillingResolver {
  constructor(private readonly acceptBillingService: AcceptBillingService) {}

  @Mutation(() => AcceptBillingResponse)
  async acceptBilling(
    @Args('input') input: AcceptBillingInput,
  ): Promise<AcceptBillingResponse> {
    return this.acceptBillingService.startAcceptBilling(input);
  }
}
