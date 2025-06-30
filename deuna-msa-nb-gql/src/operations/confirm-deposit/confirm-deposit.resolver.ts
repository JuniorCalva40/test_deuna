import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { ConfirmDepositResponse } from './dto/confirm-deposit-response.dto';
import { ConfirmDepositInput } from './dto/confirm-deposit-input.dto';
import { ConfirmDepositService } from './services/confirm-deposit.service';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { UseGuards } from '@nestjs/common';
import { AuthToken } from '../../core/schema/auth-token.schema';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';

@Resolver()
export class ConfirmDepositResolver {
  constructor(
    private readonly confirmDepositService: ConfirmDepositService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Query(() => ConfirmDepositResponse)
  async confirmDeposit(
    @Args('input') input: ConfirmDepositInput,
    @Context() context,
  ): Promise<ConfirmDepositResponse> {
    const authToken: AuthToken = context?.req?.headers['auth-token'];

    const data = {
      trackingId: authToken.sessionId,
      transactionId: input.transactionId,
      deviceId: authToken.deviceId,
    };

    return this.confirmDepositService.confirmDeposit(data);
  }
}
