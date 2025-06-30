import { Resolver, Args, Mutation, Context } from '@nestjs/graphql';
import { AcceptContractService } from './services/accept-contract.service';
import { AcceptContractDataResponseDto } from './dto/accept-contract-response.dto';
import { AcceptContractDataInputDto } from './dto/accept-contract-input.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { User } from '../../core/schema/user.schema';

@Resolver()
export class AcceptContractResolver {
  constructor(private readonly acceptContractService: AcceptContractService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard)
  @Mutation(() => AcceptContractDataResponseDto, { name: 'acceptContract' })
  async acceptContract(
    @Args('input') input: AcceptContractDataInputDto,
    @Context() context,
  ): Promise<AcceptContractDataResponseDto> {
    const user: User = context?.req?.headers['user-person'];
    return this.acceptContractService.startAcceptContract(input, user.email);
  }
}
