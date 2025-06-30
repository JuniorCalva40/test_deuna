import { Injectable, Inject, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import {
  QueryDataDocument,
  QueryDocumentInput,
} from '../dto/query-document-input.dto';
import { QueryDocumentResponse } from '../dto/query-document-response.dto';
import {
  IMsaNbCnbOrqService,
  MSA_NB_CNB_ORQ_SERVICE,
} from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';

interface ErrorConfig {
  code: string;
  message: string;
  details?: any;
}

@Injectable()
export class QueryDocumentService {
  private readonly logger = new Logger(QueryDocumentService.name);
  private readonly CONTEXT = 'document';

  constructor(
    @Inject(MSA_NB_CNB_ORQ_SERVICE)
    private readonly msaNbCnbOrqService: IMsaNbCnbOrqService,
  ) {}

  async queryDocument(
    input: QueryDocumentInput,
  ): Promise<QueryDocumentResponse> {
    try {
      await this.validateInput(input);
      const document = await this.fetchDocument(
        this.buildDocumentRequest(input),
      );
      await this.validateResponse(document);
      return this.buildSuccessResponse(document.data);
    } catch (error) {
      this.handleQueryDocumentError(error, input);
    }
  }

  private buildDocumentRequest(input: QueryDocumentInput): any {
    return {
      templateName: input.templateName,
      templatePath: `cnb/documents/${input.templateName}.html`,
    };
  }

  private async validateInput(input: QueryDocumentInput): Promise<void> {
    if (!input || !input.templateName) {
      this.throwError({
        code: ErrorCodes.DOC_FORMAT_INVALID,
        message: 'Template name is required',
      });
    }

    if (typeof input.templateName !== 'string') {
      this.throwError({
        code: ErrorCodes.DOC_FORMAT_INVALID,
        message: 'Template name must be a string',
      });
    }

    const templateNameRegex = /^[a-zA-Z0-9-_]+$/;
    if (!templateNameRegex.test(input.templateName)) {
      this.throwError({
        code: ErrorCodes.DOC_FORMAT_INVALID,
        message: 'Template name contains invalid characters',
      });
    }
  }

  private async fetchDocument(body: any): Promise<any> {
    try {
      return await lastValueFrom(this.msaNbCnbOrqService.queryDocument(body));
    } catch (error) {
      this.handleConnectionError(error);
      throw error;
    }
  }

  private handleConnectionError(error: any): void {
    const connectionErrors = {
      ETIMEDOUT: {
        code: ErrorCodes.SYS_TIMEOUT_EXCEEDED,
        message: 'Document service connection timeout',
      },
      ECONNABORTED: {
        code: ErrorCodes.SYS_TIMEOUT_EXCEEDED,
        message: 'Document service connection timeout',
      },
      ECONNREFUSED: {
        code: ErrorCodes.SYS_SERVICE_DOWN,
        message: 'Document service is unavailable',
      },
    };

    const errorConfig = connectionErrors[error?.code];
    if (errorConfig) {
      this.throwError({ ...errorConfig, details: error });
    }
  }

  private async validateResponse(response: any): Promise<void> {
    if (!response) {
      this.throwError({
        code: ErrorCodes.DOC_TYPE_INVALID,
        message: 'Document template not found',
      });
    }

    if (!response.data) {
      this.throwError({
        code: ErrorCodes.DOC_FORMAT_INVALID,
        message: 'Document data is missing or invalid',
      });
    }

    if (!response.data.presignedUrl || !response.data.b64encoded) {
      this.throwError({
        code: ErrorCodes.DOC_RESPONSE_INVALID,
        message: 'Document response format is invalid',
      });
    }
  }

  private buildSuccessResponse(data: QueryDataDocument): QueryDocumentResponse {
    return {
      status: 'SUCCESS',
      message: 'Document query successful',
      data: {
        presignedUrl: data.presignedUrl,
        b64encoded: data.b64encoded,
      },
    };
  }

  private handleQueryDocumentError(
    error: any,
    input: QueryDocumentInput,
  ): never {
    if (error?.response?.status) {
      const httpError = this.getHttpErrorConfig(error.response.status, input);
      this.throwError({ ...httpError, details: error });
    }

    this.throwError({
      code: ErrorCodes.SYS_ERROR_UNKNOWN,
      message: error.message || 'Unknown error processing document query',
      details: error,
    });
  }

  private getHttpErrorConfig(
    status: number,
    input: QueryDocumentInput,
  ): ErrorConfig {
    const httpErrorMap: Record<number, ErrorConfig> = {
      400: {
        code: ErrorCodes.DOC_FORMAT_INVALID,
        message: 'Invalid document request format',
      },
      401: {
        code: ErrorCodes.AUTH_TOKEN_INVALID,
        message: 'Authentication failed for document service',
      },
      403: {
        code: ErrorCodes.AUTH_TOKEN_INVALID,
        message: 'Unauthorized access to document service',
      },
      404: {
        code: ErrorCodes.DOC_TYPE_INVALID,
        message: `Template not found: ${input.templateName}`,
      },
      413: {
        code: ErrorCodes.DOC_SIZE_EXCEEDED,
        message: 'Document size limit exceeded',
      },
      429: {
        code: ErrorCodes.SYS_SERVICE_DOWN,
        message: 'Document service rate limit exceeded',
      },
    };

    // Server errors (500, 502, 503, 504)
    if (status >= 500 && status < 600) {
      return {
        code: ErrorCodes.SYS_SERVICE_DOWN,
        message: 'Document service is currently unavailable',
      };
    }

    return (
      httpErrorMap[status] || {
        code: ErrorCodes.SYS_PROCESS_FAILED,
        message: 'Unexpected error while processing document',
      }
    );
  }

  private throwError(config: ErrorConfig): never {
    return ErrorHandler.handleError(config, this.CONTEXT);
  }
}
