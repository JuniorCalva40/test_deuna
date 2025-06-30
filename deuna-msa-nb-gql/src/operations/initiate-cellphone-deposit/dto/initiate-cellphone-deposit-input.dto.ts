import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { ParseAmount } from '../../../core/decorators/parse-amount.decorator';
import { TrackingBaseDto } from '../../../common/constants/common';

@InputType()
export class InitiateCellPhoneDepositInput {
  @Field(() => String)
  @IsNotEmpty()
  beneficiaryPhoneNumber: string;

  @Field(() => String)
  @IsNotEmpty()
  @ParseAmount({ min: 0.01 })
  amount: string;
}

export class InitiateCellPhoneDepositServiceInput extends TrackingBaseDto {
  beneficiaryPhoneNumber: string;

  ordererIdentification: string;

  ipAddress: string;

  deviceId: string;

  amount: number;

  reason: string;
}
