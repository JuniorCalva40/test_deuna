import { Resolver, Args, Mutation, Context } from '@nestjs/graphql';
import { ConfirmDataService } from './services/confirm-data.service';
import { ConfirmDataInputDto } from './dto/confirm-data-input.dto';
import { ConfirmDataResponseDto } from './dto/confirm-data-response.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';
import { HeaderValue } from '../../core/decorators/header.decorator';
import { v4 as uuidv4 } from 'uuid';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
@Resolver()
export class ConfirmDataResolver {
  constructor(private readonly confirmDataService: ConfirmDataService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Mutation(() => ConfirmDataResponseDto, { name: 'confirmData' })
  async confirmData(
    @HeaderValue('x-session-id') sessionId: string,
    @Context() context,
    @Args('input') input: ConfirmDataInputDto,
  ): Promise<ConfirmDataResponseDto> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    const identificationNumber = customerInfo?.identification;

    if (!identificationNumber) {
      throw new Error(
        'Identification number is required, identification number is missing',
      );
    }

    sessionId = sessionId || uuidv4();
    const trackingId = uuidv4();
    const requestId = uuidv4();
    const inputData: ConfirmDataInputDto = {
      ...input,
      identificationNumber,
      sessionId,
      trackingId,
      requestId,
    };
    return this.confirmDataService.startConfirmData(inputData);
  }
}
