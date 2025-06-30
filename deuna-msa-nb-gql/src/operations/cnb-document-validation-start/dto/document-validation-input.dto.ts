import { IsNotEmpty } from 'class-validator';
import { DocumentValidationType } from '../../../common/constants/common';
import { InputType, Field } from '@nestjs/graphql';
import { TrackingBaseDto } from '../../../common/constants/common';
@InputType()
export class DocumentValidationStartDto extends TrackingBaseDto {
  @Field()
  @IsNotEmpty()
  frontsideImage: string;
  @Field()
  @IsNotEmpty()
  backsideImage: string;
  @Field()
  @IsNotEmpty()
  country: string;
  @Field()
  @IsNotEmpty()
  idType: DocumentValidationType;
  @Field()
  @IsNotEmpty()
  onboardingSessionId: string;

  identificationNumber: string;
}

export class ServiceDocumentValidationDto extends DocumentValidationStartDto {
  trackingId: string;
  sessionId: string;
  requestId: string;
  merchantIdScanReference: string;
}
