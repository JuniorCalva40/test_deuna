import { Args, Mutation, Resolver, Context } from '@nestjs/graphql';
import { ExecuteDepositService } from './service/execute-deposit.service';
import {
  ExecuteDepositInput,
  ExecuteDepositResponse,
} from './dto/execute-deposit.dto';
import { UseGuards } from '@nestjs/common';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { AuthToken } from '../../core/schema/auth-token.schema';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';

@Resolver()
export class ExecuteDepositResolver {
  constructor(private executeDepositService: ExecuteDepositService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Mutation(() => ExecuteDepositResponse)
  async confirmCellPhoneDeposit(
    @Args('input') input: ExecuteDepositInput,
    @Context() context,
  ): Promise<ExecuteDepositResponse> {
    const authToken: AuthToken = context?.req?.headers['auth-token'];
    const ip = authToken?.data?.ip ?? '127.0.0.1';

    return this.executeDepositService.executeDeposit(
      input,
      authToken.deviceId,
      authToken.sessionId,
      ip,
      authToken.sessionId,
    );
  }
}
