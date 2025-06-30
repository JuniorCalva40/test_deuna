import { Resolver, Query, Args } from '@nestjs/graphql';
import { QueryOnboardingStatusService } from './services/query-onboarding-status.service';
import { QueryOnboardingStatusDto } from './dto/query-onboarding-status.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';

@Resolver()
export class QueryOnboardingStatusResolver {
  constructor(
    private readonly queryOnboardingStatusService: QueryOnboardingStatusService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard)
  @Query(() => QueryOnboardingStatusDto)
  async queryOnboardingStatus(
    @Args('sessionId') sessionId: string,
  ): Promise<QueryOnboardingStatusDto> {
    return this.queryOnboardingStatusService.getOnboardingStatus(sessionId);
  }
}
