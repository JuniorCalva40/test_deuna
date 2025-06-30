import { Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { HeaderValue } from '../../core/decorators/header.decorator';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { GenerateCommissionInvoiceInput } from './dto/generate-commission-invoice.input.dto';
import { GenerateCommissionInvoiceResponseDto } from './dto/generate-commission-invoice.response.dto';
import { GenerateCommissionInvoiceService } from './service/generate-commission-invoice.service';

@Resolver()
export class GenerateCommissionInvoiceResolver {
  constructor(
    private readonly generateCommissionInvoiceService: GenerateCommissionInvoiceService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetClientGuard)
  @Mutation(() => GenerateCommissionInvoiceResponseDto, {
    name: 'generateCommissionInvoice',
  })
  async generateCommissionInvoice(
    @HeaderValue('x-session-id') sessionId: string,
    @Context() context,
  ): Promise<GenerateCommissionInvoiceResponseDto> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    if (!customerInfo) {
      throw new Error(
        'Customer info is required, customer info is missing in query-get-commission-payout-preview',
      );
    }

    const input: GenerateCommissionInvoiceInput = {
      identification: customerInfo.identification,
      merchantId: customerInfo.identification,
      comercialName: customerInfo.comercialName,
      sessionId: sessionId || uuidv4(),
      trackingId: uuidv4(),
      requestId: uuidv4(),
    };

    return this.generateCommissionInvoiceService.generateCommissionInvoice(
      input,
    );
  }
}
