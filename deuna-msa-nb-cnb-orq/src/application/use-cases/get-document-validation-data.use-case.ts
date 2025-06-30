import { Injectable, Inject } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from '../../domain/utils/format-logger';
import { DOCUMENT_VALIDATION_CLIENT_PORT } from '../../domain/constants/injection.constants';
import { DocumentValidationClientPort } from '../ports/out/clients/document-validation-client.port';
import { DocumentValidationDataResultDto } from '../dto/document-validation-data-result.dto';

@Injectable()
export class GetDocumentValidationDataUseCase {
  private readonly logger = new Logger({
    context: GetDocumentValidationDataUseCase.name,
  });

  constructor(
    @Inject(DOCUMENT_VALIDATION_CLIENT_PORT)
    private readonly documentValidationClient: DocumentValidationClientPort,
  ) {}

  async execute(
    scanReference: string,
    trackingData: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationDataResultDto> {
    const { trackingId, sessionId, requestId } = trackingData;

    try {
      const response = await this.documentValidationClient.getValidationData(
        scanReference,
        trackingData,
      );

      const result: DocumentValidationDataResultDto = {
        status: response.status,
        ...response,
      };

      return result;
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `UseCase - Error getting document validation data: ${error.message}`,
        sessionId,
        trackingId,
        requestId,
      );
      throw error;
    }
  }
}
