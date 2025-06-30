import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import {
  UseGuards,
  UsePipes,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import { GenerateQrService } from './services/generate-qr.service';
import { GenerateQrInput } from './dto/generate-qr-input.dto';
import { GenerateQrResponse } from './dto/generate-qr-response.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { ErrorCodes } from '../../common/constants/error-codes';
import { AuthToken } from '../../core/schema/auth-token.schema';
import { ErrorHandler } from '../../utils/error-handler.util';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { CnbQrInfoResponse } from './dto/cnb-qr-info-response.dto';
import { GetQrInput } from './dto/get-qr-input.dto';
import { DecryptInputPipe } from '../../core/pipes/decrypt-input.pipe';
import { ParseAmountPipe } from '../../core/pipes/parse-amount.pipe';
import { qrGeneratorDecryptFields } from '../../common/constants/decrypt-fields.constant';
import { ValidationExceptionFilter } from '../../core/filters/validation-exception.filter';

interface ErrorConfig {
  code: string;
  message: string;
  details?: any;
}

@Resolver()
export class GenerateQrResolver {
  constructor(private readonly generateQrService: GenerateQrService) {}
  private readonly CONTEXT = 'generate-qr';

  private throwError(config: ErrorConfig): never {
    return ErrorHandler.handleError(config, this.CONTEXT);
  }

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetClientGuard)
  @Mutation(() => GenerateQrResponse)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false },
    }),
  )
  @UseFilters(ValidationExceptionFilter)
  async qrGenerator(
    @Args(
      'input',
      new DecryptInputPipe(qrGeneratorDecryptFields),
      new ParseAmountPipe(),
    )
    input: GenerateQrInput,
    @Context() context,
  ): Promise<GenerateQrResponse> {
    const authToken: AuthToken = context.req.headers['auth-token'];

    if (!authToken?.data?.personInfo?.identification) {
      this.throwError({
        code: ErrorCodes.AUTH_USER_NOT_FOUND,
        message: 'User identification not found in auth token',
      });
    }

    if (!authToken?.deviceId) {
      this.throwError({
        code: ErrorCodes.TRANSACTION_DEVICE_INVALID,
        message: 'Device ID not found in auth token',
      });
    }

    const customerInfo: ClientInfo = context.req.headers['client-info'];

    if (!customerInfo?.id) {
      this.throwError({
        code: ErrorCodes.MERCHANT_CLIENT_INFO_INVALID,
        message: 'Merchant ID not found in client info',
      });
    }

    const qrResponse = await this.generateQrService.generateQr(
      authToken.deviceId,
      input.amount,
      authToken.data.personInfo.identification,
      customerInfo.businessName,
      customerInfo.clientAcountId,
      customerInfo.id,
    );

    const response: GenerateQrResponse = {
      status: qrResponse.status,
      qrBase64: qrResponse.data.qrBase64,
      transactionId: qrResponse.data.transactionId,
      qrUrl: qrResponse.data.qrUrl,
      qrId: qrResponse.data.qrId,
    };

    return response;
  }

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard)
  @Query(() => CnbQrInfoResponse)
  async cnbQrInfo(
    @Args('input') input: GetQrInput,
  ): Promise<CnbQrInfoResponse> {
    const qrResponse = await this.generateQrService.getQr(input.transactionId);

    const response: CnbQrInfoResponse = {
      status: qrResponse.data.status,
      cnbAccount: qrResponse.data.cnbAccount,
      amount: qrResponse.data.amount,
      peopleAccount: qrResponse.data.peopleAccount,
      peopleName: qrResponse.data.peopleName,
      transactionNumber: qrResponse.data.transactionNumber,
      transactionDate: qrResponse.data.transactionDate,
    };

    return response;
  }
}
