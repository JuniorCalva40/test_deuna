import { Injectable, Inject, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { QueryDocumentInput } from '../dto/query-document-input.dto';
import { QueryDocumentResponse } from '../dto/query-document-response.dto';
import { MSA_CO_DOCUMENT_SERVICE } from '../../../external-services/msa-co-document/providers/msa-co-document.provider';
import { IMsaCoDocumentService } from '../../../external-services/msa-co-document/interfaces/msa-co-document-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';

@Injectable()
export class QueryDocumentService {
  private readonly logger = new Logger(QueryDocumentService.name);
  constructor(
    @Inject(MSA_CO_DOCUMENT_SERVICE)
    private readonly msaCoDocumentService: IMsaCoDocumentService,
  ) {}

  async queryDocument(
    input: QueryDocumentInput,
  ): Promise<QueryDocumentResponse> {
    const body = {
      templateName: input.templateName,
      templatePath: `onboarding/documents/${input.templateName}.html`,
    };
    try {
      const responseQueryDocument = await lastValueFrom(
        this.msaCoDocumentService.queryDocument(body),
      );

      if (!responseQueryDocument) {
        return ErrorHandler.handleError(
          `Fail! Querying document with templateName: ${input.templateName}`,
          'query-document',
        );
      }

      const response: QueryDocumentResponse = {
        status: 'SUCCESS',
        message: 'Documento consultado correctamente',
        data: responseQueryDocument.data,
      };

      return response;
    } catch (error) {
      return ErrorHandler.handleError(error, 'query-document');
    }
  }
}
