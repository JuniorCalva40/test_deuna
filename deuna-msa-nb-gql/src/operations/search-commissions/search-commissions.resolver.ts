import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { SearchCommissionsService } from './services/search-commissions.service';
import { SearchCommissionsInputDto } from './dto/search-commissions-input.dto';
import { SearchCommissionsResponseDto } from './dto/search-commissions-response.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';

@Resolver()
export class SearchCommissionsResolver {
  constructor(
    private readonly searchCommissionsService: SearchCommissionsService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetClientGuard)
  @Query(() => SearchCommissionsResponseDto, { name: 'searchCommissions' })
  async searchCommissions(
    @Args('input') input: SearchCommissionsInputDto,
    @Context() context,
  ): Promise<SearchCommissionsResponseDto> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    if (!customerInfo) {
      throw new Error('Customer info is required, customer info is missing');
    }

    return this.searchCommissionsService
      .searchCommissions(input, customerInfo.id)
      .toPromise();
  }
}
