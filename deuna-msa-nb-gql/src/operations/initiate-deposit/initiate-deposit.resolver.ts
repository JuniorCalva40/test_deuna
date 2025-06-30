import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { InitiateDepositResponse } from './dto/initiate-deposit-response.dto';
import { InitiateDepositInput } from './dto/initiate-deposit-input.dto';
import { InitiateDepositService } from './services/initiate-deposit.service';
import { UseGuards } from '@nestjs/common';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';

@Resolver()
export class InitiateDepositResolver {
  constructor(
    private readonly initiateDepositService: InitiateDepositService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard)
  @Mutation(() => InitiateDepositResponse)
  async initiateDeposit(
    @Args('input') input: InitiateDepositInput,
  ): Promise<InitiateDepositResponse> {
    return this.initiateDepositService.initiateDeposit(input);
  }
}
