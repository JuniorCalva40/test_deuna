import { Field, Float, ObjectType } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

/**
 * Represents the tax details for the commission payout.
 */
@ObjectType('CommissionPayoutTaxDetails')
class TaxDetails {
  @Field(() => Float, { description: 'The tax rate applied.' })
  rate: number;

  @Field(() => Float, { description: 'The total tax amount.' })
  amount: number;
}

/**
 * Represents the destination account for the commission payout.
 */
@ObjectType('CommissionPayoutDestinationAccount')
class DestinationAccount {
  @Field({ description: 'The name of the account holder.' })
  name: string;

  @Field({ description: "The account holder's RUC." })
  ruc: string;
}

/**
 * Represents the main data structure for the commission payout preview.
 */
@ObjectType('PrepareCommissionPayout')
class PrepareCommissionPayout {
  @Field(() => Float, { description: 'The subtotal amount before taxes.' })
  subtotalAmount: number;

  @Field(() => TaxDetails, { description: 'The tax details.' })
  taxDetails: TaxDetails;

  @Field(() => Float, { description: 'The net amount to be paid out.' })
  netPayoutAmount: number;

  @Field({ description: 'The currency of the payout.' })
  currency: string;

  @Field({ description: 'The reason for the payout.' })
  payoutReason: string;

  @Field(() => DestinationAccount, {
    description: 'The destination bank account.',
  })
  destinationAccount: DestinationAccount;
}

/**
 * The response DTO for the GetCommissionPayoutPreview query.
 */
@ObjectType()
export class GetCommissionPayoutPreviewResponseDto extends StandardizedResponse {
  @Field(() => PrepareCommissionPayout, {
    description: 'The prepared commission payout preview details.',
  })
  prepareCommissionPayout: PrepareCommissionPayout;
}
