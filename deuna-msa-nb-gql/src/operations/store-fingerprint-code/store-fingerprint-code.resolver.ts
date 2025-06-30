import { Resolver, Args, Mutation, Context } from '@nestjs/graphql';
import { StoreFingeprintCodeService } from './services/store-fingerprint-code.service';
import { FingeprintCodeResponseDto } from './dto/fingerprint-code-response.dto';
import { FingeprintCodeInputDto } from './dto/fingerprint-code-input.dto';

import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { storeFingeprintCodeDecryptFields } from '../../common/constants/decrypt-fields.constant';
import { DecryptInputPipe } from '../../core/pipes/decrypt-input.pipe';
import { v4 as uuidv4 } from 'uuid';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { HeaderValue } from '../../core/decorators/header.decorator';

@Resolver()
export class StoreFingeprintCodeResolver {
  constructor(
    private readonly storeFingeprintCodeService: StoreFingeprintCodeService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Mutation(() => FingeprintCodeResponseDto, { name: 'storeFingeprintCode' })
  async storeFingeprintCode(
    @Args('input', new DecryptInputPipe(storeFingeprintCodeDecryptFields))
    input: FingeprintCodeInputDto,
    @Context() context,
    @HeaderValue('x-session-id') sessionId: string,
  ): Promise<FingeprintCodeResponseDto> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    const identificationNumber = customerInfo?.identification;

    if (!identificationNumber) {
      throw new Error(
        'Identification number is required, identification number is missing',
      );
    }

    const trackingId = uuidv4();
    const requestId = uuidv4();

    sessionId = sessionId || uuidv4();

    const inputDto: FingeprintCodeInputDto = {
      onboardingSessionId: input.onboardingSessionId,
      nationalID: input.nationalID,
      fingerprintData: input.fingerprintData,
      identificationNumber,
      trackingId,
      requestId,
      sessionId,
    };
    return this.storeFingeprintCodeService.storeFingeprintCode(inputDto);
  }
}
