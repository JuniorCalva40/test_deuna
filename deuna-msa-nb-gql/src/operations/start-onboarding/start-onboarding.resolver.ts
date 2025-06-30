import { Resolver, Mutation, Context } from '@nestjs/graphql';
import { StartOnboardingService } from './service/start-onboarding.service';
import { StartOnboardingResponse } from './dto/start-onboarding-response.dto';

import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { User } from '../../core/schema/user.schema';
import { AuthToken } from 'src/core/schema/auth-token.schema';

@Resolver()
export class StartOnboardingResolver {
  constructor(
    private readonly startOnboardingService: StartOnboardingService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard)
  @Mutation(() => StartOnboardingResponse)
  async startOnboarding(@Context() context): Promise<StartOnboardingResponse> {
    const authorizationHeader: AuthToken = context?.req?.headers['auth-token'];
    const user: User = context?.req?.headers['user-person'];

    return this.startOnboardingService.startOnboarding(
      authorizationHeader?.data?.username,
      user.email,
    );
  }
}
