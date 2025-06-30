import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { ValidateDepositAccountResponse } from './dto/validate-deposit-account-response.dto';
import { ValidateDepositAccountInput } from './dto/validate-deposit-account-input.dto';
import { ValidateDepositAccountService } from './services/validate-deposit-account.service';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { UseGuards, UsePipes, UseFilters, ValidationPipe } from '@nestjs/common';
import { AuthToken } from '../../core/schema/auth-token.schema';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { DecryptInputPipe } from '../../core/pipes/decrypt-input.pipe';
import { validateDepositAccountDecryptFields } from '../../common/constants/decrypt-fields.constant';
import { ValidationExceptionFilter } from '../../core/filters/validation-exception.filter';

@Resolver()
export class ValidateDepositAccountResolver {
  constructor(
    private readonly validateDepositAccountService: ValidateDepositAccountService,
  ) { }

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Query(() => ValidateDepositAccountResponse)
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validationError: { target: false },
  }))
  @UseFilters(ValidationExceptionFilter)
  async validateDepositAccount(
    @Args('input', new DecryptInputPipe(validateDepositAccountDecryptFields))
    input: ValidateDepositAccountInput,
    @Context() context,
  ): Promise<ValidateDepositAccountResponse> {
    const authToken: AuthToken = context?.req?.headers['auth-token'];

    const data = {
      trackingId: authToken.sessionId,
      beneficiaryPhoneNumber: input.beneficiaryPhoneNumber,
    };

    return this.validateDepositAccountService.validateDepositAccount(data);
  }
}
