import { Resolver, Query, Context } from '@nestjs/graphql';
import { ClientsService } from './service/clients.service';
import { DataResponse } from './dto/response.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';
import { AuthToken } from 'src/core/schema/auth-token.schema';

@Resolver()
export class ClientsResolver {
  constructor(private readonly clientsService: ClientsService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard)
  @Query(() => DataResponse, { name: 'validateCnbState' })
  async validateCnbState(
    @Context() context, // Inyecta el contexto de la solicitud
  ): Promise<DataResponse> {
    const authorizationHeader: AuthToken = context?.req?.headers['auth-token'];

    return this.clientsService.validateCnbState(
      authorizationHeader?.data?.username,
    );
  }
}
