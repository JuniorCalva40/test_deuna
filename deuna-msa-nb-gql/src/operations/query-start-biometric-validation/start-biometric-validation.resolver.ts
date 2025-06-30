import { Resolver, Args, Query, Context } from '@nestjs/graphql';
import { StartBiometricValidationService } from './services/start-biometric-validation.service';
import { StartBiometricValidationInputDto } from './dto/start-biometric-validation-input.dto';
import { StartBiometricValidationResponseDto } from './dto/start-biometric-validation-response.dto';
import { HeaderValue } from '../../core/decorators/header.decorator';
import { v4 as uuidv4 } from 'uuid';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { ProfileType } from '../../core/guards/validation-auth.guard';
import { Profile } from '../../core/guards/validation-auth.guard';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { UseGuards } from '@nestjs/common';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
@Resolver()
export class StartBiometricValidationResolver {
  constructor(
    private readonly startBiometricValidationService: StartBiometricValidationService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Query(() => StartBiometricValidationResponseDto, {
    name: 'startBiometricValidation',
  })
  async startBiometricValidation(
    @Args('input') input: StartBiometricValidationInputDto,
    @HeaderValue('x-session-id') sessionId: string,
    @Context() context,
  ): Promise<StartBiometricValidationResponseDto> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    const identificationNumber = customerInfo?.identification;

    if (!identificationNumber) {
      throw new Error(
        'Identification number is required, identification number is missing in biometric validation',
      );
    }

    sessionId = sessionId || uuidv4();
    const trackingId = uuidv4();
    const requestId = uuidv4();

    const inputData: StartBiometricValidationInputDto = {
      ...input,
      identificationNumber,
      sessionId,
      trackingId,
      requestId,
    };

    return this.startBiometricValidationService.startBiometricValidation(
      inputData,
    );
  }
}
