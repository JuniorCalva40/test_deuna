import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { SignContractService } from './service/sign-contract.service';
import { SignContractResponse } from './dto/sign-contract-response.dto';
import { SignContractInput } from './dto/sign-contract-input.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';

@Resolver()
export class SignContractResolver {
  constructor(private readonly signContractService: SignContractService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard)
  @Mutation(() => SignContractResponse)
  async signContract(
    @Args('input') input: SignContractInput,
  ): Promise<SignContractResponse> {
    return this.signContractService.signContract(input);
  }
}
