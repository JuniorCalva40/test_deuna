import { Injectable, Inject } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from '../../domain/utils/format-logger';
import { DocumentValidationStatusResponse } from '../dto/document-validation-response.dto';
import { DOCUMENT_VALIDATION_CLIENT_PORT } from '../../domain/constants/injection.constants';
import { DocumentValidationClientPort } from '../ports/out/clients/document-validation-client.port';

@Injectable()
export class GetDocumentValidationStatusUseCase {
  private readonly logger = new Logger({
    context: GetDocumentValidationStatusUseCase.name,
  });

  constructor(
    @Inject(DOCUMENT_VALIDATION_CLIENT_PORT)
    private readonly documentValidationClient: DocumentValidationClientPort,
  ) {}

  async execute(
    scanReference: string,
    trackingData: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationStatusResponse> {
    const { trackingId, sessionId, requestId } = trackingData;

    try {
      return await this.documentValidationClient.getValidationStatus(
        scanReference,
        trackingData,
      );
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `UseCase - Error getting document validation status: ${error.message}`,
        sessionId,
        trackingId,
        requestId,
      );
      throw error;
    }
  }
}
