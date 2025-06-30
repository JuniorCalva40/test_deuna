import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { DocumentValidationService } from './service/document-validation.service';
import { DocumentValidationStartDto } from './dto/document-validation-input.dto';
import { DocumentValidationResponse } from './dto/document-validation-response.dto';
import { v4 as uuidv4 } from 'uuid';
import { Profile, ProfileType } from '../../core/guards/validation-auth.guard';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HeaderValue } from '../../core/decorators/header.decorator';
import { UseGuards } from '@nestjs/common';
import { Context } from '@nestjs/graphql';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
@Resolver()
export class DocumentValidationResolver {
  constructor(
    private readonly documentValidationService: DocumentValidationService,
  ) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
  @Mutation(() => DocumentValidationResponse)
  async kycValidateDocument(
    @Args('input') input: DocumentValidationStartDto,
    @HeaderValue('x-session-id') sessionId: string,
    @Context() context,
  ): Promise<DocumentValidationResponse> {
    const customerInfo: ClientInfo = context?.req?.headers['client-info'];

    const identificationNumber = customerInfo?.identification;

    if (!identificationNumber) {
      throw new Error(
        'Identification number is required, identification number is missing',
      );
    }

    sessionId = sessionId || uuidv4();
    const trackingId = uuidv4();
    const requestId = uuidv4();
    const merchantIdScanReference = uuidv4();

    const bodyInput = {
      ...input,
      sessionId,
      trackingId,
      requestId,
      merchantIdScanReference,
      identificationNumber,
    };
    return this.documentValidationService.startDocumentValidation(bodyInput);
  }
}
