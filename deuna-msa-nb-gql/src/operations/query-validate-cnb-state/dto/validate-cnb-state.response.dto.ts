import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';
import { CnbState, PreApprovedState } from '../../../common/constants/common';
import { EstablishmentValidateCnbOutputDto } from '../../../utils/establishment.dto';

@ObjectType()
export class ErrorDto {
  @Field()
  code: string;

  @Field()
  message: string;
}

@ObjectType()
export class AddressDto {
  @Field()
  fullAddress: string;

  @Field()
  status: string;

  @Field()
  isHeadquarters: string;

  @Field()
  commercialName: string;

  @Field()
  establishmentNumber: string;

  @Field()
  establishmentType: string;
}

@ObjectType()
export class DataResponse extends StandardizedResponse {
  @Field({ nullable: true })
  cnbState: CnbState;

  @Field(() => String)
  preApprovedState: PreApprovedState;

  @Field()
  merchantName: string;

  @Field({ nullable: true })
  remainingAttemptsOnb: number;

  @Field(() => [EstablishmentValidateCnbOutputDto], { nullable: true })
  address: EstablishmentValidateCnbOutputDto[];
}
