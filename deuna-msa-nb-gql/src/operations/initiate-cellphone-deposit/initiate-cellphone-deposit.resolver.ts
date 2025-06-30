import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { InitiateCellPhoneDepositResponse } from './dto/initiate-cellphone-deposit-response.dto';
import { InitiateCellPhoneDepositInput } from './dto/initiate-cellphone-deposit-input.dto';
import { InitiateCellPhoneDepositService } from './services/initiate-cellphone-deposit.service';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import {
  UseGuards,
  UsePipes,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { AuthToken } from '../../core/schema/auth-token.schema';
import { DEPOSIT_REASON } from '../../common/constants/common';
import { DecryptInputPipe } from '../../core/pipes/decrypt-input.pipe';
import { ParseAmountPipe } from '../../core/pipes/parse-amount.pipe';
import { initiateCellPhoneDepositDecryptFields } from '../../common/constants/decrypt-fields.constant';
import { ValidationExceptionFilter } from '../../core/filters/validation-exception.filter';
import { HeaderValue } from '../../core/decorators/header.decorator';
import { v4 as uuidv4 } from 'uuid';

@Resolver()
export class InitiateCellPhoneDepositResolver {
  constructor(
    private readonly initiateCellPhoneDepositService: InitiateCellPhoneDepositService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Mutation(() => InitiateCellPhoneDepositResponse)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false },
    }),
  )
  @UseFilters(ValidationExceptionFilter)
  async initiateCellPhoneDeposit(
    @Args(
      'input',
      new DecryptInputPipe(initiateCellPhoneDepositDecryptFields),
      new ParseAmountPipe(),
    )
    input: InitiateCellPhoneDepositInput,
    @HeaderValue('x-session-id') sessionId: string,
    @Context() context,
  ): Promise<InitiateCellPhoneDepositResponse> {
    const authorizationHeader: AuthToken = context?.req?.headers['auth-token'];
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    const data = {
      beneficiaryPhoneNumber: input.beneficiaryPhoneNumber,
      ordererIdentification: customerInfo.identification,
      ipAddress: authorizationHeader?.data?.ip ?? '0.0.0.0',
      deviceId: authorizationHeader.deviceId,
      amount: Number(input.amount),
      reason: DEPOSIT_REASON,
      sessionId,
      trackingId: uuidv4(),
      requestId: uuidv4(),
    };

    return this.initiateCellPhoneDepositService.initiateCellPhoneDeposit(data);
  }
}
