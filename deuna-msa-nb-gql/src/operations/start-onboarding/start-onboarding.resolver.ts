import { Resolver, Mutation, Context } from '@nestjs/graphql';
import { StartOnboardingService } from './service/start-onboarding.service';
import { StartOnboardingResponse } from './dto/start-onboarding-response.dto';
import { HeaderValue } from '../../core/decorators/header.decorator';
import { v4 as uuidv4 } from 'uuid';

import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { User } from '../../core/schema/user.schema';
import { StartOnboardingInput } from './dto/start-onboarding-input.dto';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { GetClientGuard } from '../../core/guards/get-client.guard';

@Resolver()
export class StartOnboardingResolver {
  constructor(
    private readonly startOnboardingService: StartOnboardingService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Mutation(() => StartOnboardingResponse)
  async startOnboarding(
    @HeaderValue('x-session-id') sessionId: string,
    @Context() context,
  ): Promise<StartOnboardingResponse> {
    const user: User = context?.req?.headers['user-person'];
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];
    const username = user.username;

    sessionId = sessionId || uuidv4();
    const trackingId = uuidv4();
    const requestId = uuidv4();
    const identification = customerInfo.identification;
    const email = user.email;
    const applicantName = user.firstName;
    const applicantLastName = user.lastName;
    const phoneNumber = user.phoneNumber;
    const id = customerInfo.id;
    const businessName = customerInfo.businessName;

    const input: StartOnboardingInput = {
      username,
      identification,
      email,
      sessionId,
      trackingId,
      requestId,
      id,
      businessName,
      applicantName,
      applicantLastName,
      phoneNumber,
    };

    return this.startOnboardingService.startOnboarding(input);
  }
}
