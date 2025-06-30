import { Injectable, Inject } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { DocumentValidationPort } from '../../domain/ports/document-validation.port';
import { DocumentValidationStartDto } from '../dto/document-validation-start.dto';
import { DocumentValidationStartResponse } from '../dto/document-validation-response.dto';
import { formatLogger } from '../../domain/utils/format-logger';
import { DOCUMENT_VALIDATION_PORT } from '../../domain/constants/injection.constants';

@Injectable()
export class StartDocumentValidationUseCase {
  private readonly logger = new Logger({
    context: StartDocumentValidationUseCase.name,
  });

  constructor(
    @Inject(DOCUMENT_VALIDATION_PORT)
    private readonly documentValidationPort: DocumentValidationPort,
  ) {}

  async execute(
    input: DocumentValidationStartDto,
  ): Promise<DocumentValidationStartResponse> {
    const { trackingId, sessionId, requestId } = input;

    formatLogger(
      this.logger,
      'info',
      'UseCase - Starting document validation process',
      sessionId,
      trackingId,
      requestId,
    );

    try {
      // Start the document validation process
      return await this.documentValidationPort.startValidation(input);
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `UseCase - Error in document validation process: ${error.message}`,
        sessionId,
        trackingId,
        requestId,
      );
      throw error;
    }
  }
}
