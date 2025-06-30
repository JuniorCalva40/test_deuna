import { Injectable, Inject } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ServiceDocumentValidationDto } from '../dto/document-validation-input.dto';
import { DocumentValidationResponse } from '../dto/document-validation-response.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { MSA_NB_CNB_ORQ_SERVICE } from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { IMsaNbCnbOrqService } from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { DocumentValidationInputDto } from '../../../external-services/msa-nb-cnb-orq/dto/msa-nb-cnb-orq-input.dto';
import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from '../../../utils/format-logger';
import { ISaveElectronicSignatureResponseRedis } from '../dto/document-validation-response.dto';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class DocumentValidationService {
  private readonly logger = new Logger({
    context: DocumentValidationService.name,
  });
  private readonly CONTEXT = 'document-validation';

  constructor(
    @Inject(MSA_NB_CNB_ORQ_SERVICE)
    private readonly msaNbCnbOrqService: IMsaNbCnbOrqService,
  ) {}

  private async prepareDataSignElectronic(
    input: ServiceDocumentValidationDto,
  ): Promise<ISaveElectronicSignatureResponseRedis> {
    return await this.msaNbCnbOrqService.updateElectronicSign(
      {
        identificationNumber: input.identificationNumber,
        fileIdentificationFront: input.frontsideImage,
        fileIdentificationBack: input.backsideImage,
      },
      {
        sessionId: input.sessionId,
        trackingId: input.trackingId,
        requestId: input.requestId,
      },
    );
  }

  async startDocumentValidation(
    input: ServiceDocumentValidationDto,
  ): Promise<DocumentValidationResponse> {
    try {
      // Prepare document validation input
      const documentValidationInput: DocumentValidationInputDto = {
        merchantIdScanReference: input.merchantIdScanReference || '',
        frontsideImage: input.frontsideImage,
        backsideImage: input.backsideImage,
        country: input.country,
        idType: input.idType,
        onboardingSessionId: input.onboardingSessionId,
      };

      formatLogger(
        this.logger,
        'info',
        `Starting document validation - onboardingSessionId: ${input.onboardingSessionId} into msa-nb-cnb-orq`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      // Prepare tracking object
      const tracking = {
        sessionId: input.sessionId,
        trackingId: input.trackingId,
        requestId: input.requestId,
      };

      // Call document validation service
      const validationResponse = await lastValueFrom(
        this.msaNbCnbOrqService.documentValidation(
          documentValidationInput,
          tracking,
        ),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-nb-cnb-orq documentValidation for onboardingSessionId: ${input.onboardingSessionId}: ${error}`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        ErrorHandler.handleError(
          'Error in document validation into msa-nb-cnb-orq for onboardingSessionId: ${input.onboardingSessionId}',
          ErrorCodes.DOCUMENT_VALIDATION_CNB_ORQ_DOCUMENT_ERROR,
        );
      });

      formatLogger(
        this.logger,
        'info',
        `Finished document validation - onboardingSessionId: ${input.onboardingSessionId} in msa-nb-cnb-orq`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      if (!validationResponse) {
        return ErrorHandler.handleError(
          ErrorCodes.DOCUMENT_VALIDATION_CNB_ORQ_DOCUMENT_ERROR,
          'document-validation',
        );
      }

      input.requestId = uuidv4();
      formatLogger(
        this.logger,
        'info',
        `Starting update electronic signature request data in msa-nb-cnb-orq for onboardingSessionId: ${input.onboardingSessionId}`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      const updateElectronicSignatureResponse =
        await this.prepareDataSignElectronic(input);
      if (!updateElectronicSignatureResponse) {
        return ErrorHandler.handleError(
          {
            code: ErrorCodes.REDIS_UPDATE_ERROR,
            message:
              'Failed to update electronic signature request data in msa-nb-cnb-orq',
          },
          'document-validation',
        );
      }

      formatLogger(
        this.logger,
        'info',
        `Finished update electronic signature request data in msa-nb-cnb-orq for onboardingSessionId: ${input.onboardingSessionId}`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      const response: DocumentValidationResponse = {
        statusValidation: validationResponse.statusValidation,
        status: 'SUCCESS',
      };

      return response;
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Error in document validation into msa-nb-cnb-orq for onboardingSessionId: ${input.onboardingSessionId}: ${error.message}`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      return ErrorHandler.handleError(
        ErrorCodes.DOCUMENT_VALIDATION_CNB_ORQ_DOCUMENT_ERROR,
        'document-validation',
      );
    }
  }
}
