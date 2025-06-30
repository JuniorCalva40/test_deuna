import { Resolver, Query, Context } from '@nestjs/graphql';
import { CnbClientsService } from './service/query-cnbClients.service';
import { DataResponse } from './dto/validate-cnb-state.response.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { HeaderValue } from '../../core/decorators/header.decorator';
import { v4 as uuidv4 } from 'uuid';
import { ValidateCnbStateInput } from './dto/validate-cnb-state.input.dto';

@Resolver()
export class CnbClientsResolver {
  constructor(private readonly cnbClientsService: CnbClientsService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetClientGuard)
  @Query(() => DataResponse, { name: 'validateCnbState' })
  async validateCnbState(
    @HeaderValue('x-session-id') sessionId: string,
    @Context() context,
  ): Promise<DataResponse> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    if (!customerInfo) {
      throw new Error('Customer info is required, customer info is missing');
    }

    const inputData = {
      identification: customerInfo.identification,
      comercialName: customerInfo.comercialName,
      status: customerInfo.status,
      fullName: customerInfo.businessName,
    };
    sessionId = sessionId || uuidv4();
    const trackingId = uuidv4();
    const requestId = uuidv4();
    const input: ValidateCnbStateInput = {
      ...inputData,
      sessionId,
      trackingId,
      requestId,
    };

    return this.cnbClientsService.validateCnbState(input);
  }
}
