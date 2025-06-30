import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { SignContractService } from './service/sign-contract.service';
import { SignContractResponse } from './dto/sign-contract-response.dto';
import { SignContractInput } from './dto/sign-contract-input.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { UseGuards } from '@nestjs/common';
import { HeaderValue } from '../../core/decorators/header.decorator';
import { v4 as uuidv4 } from 'uuid';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { GetNodeIdGuard } from '../../core/guards/get-node-id.guard';

@Resolver()
export class SignContractResolver {
  constructor(private readonly signContractService: SignContractService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetClientGuard, GetNodeIdGuard)
  @Mutation(() => SignContractResponse)
  async signContract(
    @HeaderValue('x-session-id') sessionId: string,
    @HeaderValue('x-latitude') latitude: string,
    @HeaderValue('x-longitude') longitude: string,
    @Context() context,
    @Args('input') input: SignContractInput,
  ): Promise<SignContractResponse> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];
    const nodeId = context?.req?.headers['node-id'];

    sessionId = sessionId || uuidv4();
    const trackingId = uuidv4();
    const requestId = uuidv4();
    const inputData: SignContractInput = {
      ...input,
      merchantId: customerInfo.id,
      nodeId: nodeId,
      sessionId,
      trackingId,
      requestId,
      latitude: latitude,
      longitude: longitude,
      clientCnbDocumentId: customerInfo.identification,
      clientAccountId: customerInfo.clientAcountId,
    };
    return this.signContractService.signContract(inputData);
  }
}
