import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { CreateCalificationService } from './service/create-calification.service';
import {
  CreateCalificationInput,
  CreateCalificationResponse,
} from './dto/create-calification.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';
import { AuthToken } from '../../core/schema/auth-token.schema';

@Resolver()
export class CreateCalificationResolver {
  constructor(
    private readonly createCalificationService: CreateCalificationService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard)
  @Mutation(() => CreateCalificationResponse)
  async createCalification(
    @Args('input') input: CreateCalificationInput,
    @Context() context,
  ): Promise<CreateCalificationResponse> {
    const authorizationHeader: AuthToken = context?.req?.headers['auth-token'];

    return this.createCalificationService.createCalification(
      input,
      authorizationHeader?.data?.username,
    );
  }
}
