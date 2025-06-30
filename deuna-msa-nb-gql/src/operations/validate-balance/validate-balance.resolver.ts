import { Resolver, Args, Query, Context } from '@nestjs/graphql';
import { ValidateBalanceService } from './services/validate-balance.service';
import { ValidateBalanceResponseDto } from './dto/validate-balance-response.dto';
import { ValidateBalanceInputDto } from './dto/validate-balance-input.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { UseGuards } from '@nestjs/common';
import { AuthToken } from 'src/core/schema/auth-token.schema';

@Resolver()
export class ValidateBalanceResolver {
  constructor(
    private readonly validateBalanceService: ValidateBalanceService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard)
  @Query(() => ValidateBalanceResponseDto, { name: 'validateBalance' })
  async validateBalance(
    @Args('input') input: ValidateBalanceInputDto,
    @Context() context,
  ): Promise<ValidateBalanceResponseDto> {
    const authtoken: AuthToken = context?.req?.headers['auth-token'];
    const identification = authtoken.data.personInfo?.identification;
    return this.validateBalanceService.validateBalance({
      ammount: input.ammount,
      identification: identification,
    });
  }
}
