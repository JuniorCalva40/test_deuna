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
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { GetClientGuard } from '../../core/guards/get-client.guard';

@Resolver()
export class AcceptContractResolver {
  constructor(private readonly acceptContractService: AcceptContractService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Mutation(() => AcceptContractDataResponseDto, { name: 'acceptContract' })
  async acceptContract(
    @Args('input') input: AcceptContractDataInputDto,
    @Context() context,
  ): Promise<AcceptContractDataResponseDto> {
    const user: User = context?.req?.headers['user-person'];
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    if (!customerInfo) {
      throw new Error('Customer info is required, customer info is missing');
    }

    const identification = customerInfo.identification;

    return this.acceptContractService.startAcceptContract(
      input,
      user.email,
      identification,
    );
  }
}
