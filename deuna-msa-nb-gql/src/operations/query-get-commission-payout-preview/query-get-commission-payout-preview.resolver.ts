import { Resolver, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { GetCommissionPayoutPreviewService } from './service/query-get-commission-payout-preview.service';
import { GetCommissionPayoutPreviewResponseDto } from './dto/get-commission-payout-preview.response.dto';
import { GetCommissionPayoutPreviewInput } from './dto/get-commission-payout-preview.input.dto';
import { HeaderValue } from '../../core/decorators/header.decorator';
import { v4 as uuidv4 } from 'uuid';

@Resolver()
export class GetCommissionPayoutPreviewResolver {
  constructor(
    private readonly commissionPayoutPreviewService: GetCommissionPayoutPreviewService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetClientGuard)
  @Query(() => GetCommissionPayoutPreviewResponseDto, {
    name: 'prepareCommissionPayout',
  })
  async prepareCommissionPayout(
    @HeaderValue('x-session-id') sessionId: string,
    @Context() context,
  ): Promise<GetCommissionPayoutPreviewResponseDto> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    if (!customerInfo) {
      throw new Error(
        'Customer info is required, customer info is missing in query-get-commission-payout-preview',
      );
    }

    const input: GetCommissionPayoutPreviewInput = {
      identification: customerInfo.identification,
      merchantId: customerInfo.identification,
      sessionId,
      trackingId: uuidv4(),
      requestId: uuidv4(),
    };

    return this.commissionPayoutPreviewService.getCommissionPayoutPreview(
      input,
    );
  }
}
