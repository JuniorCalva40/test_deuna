import { Injectable, Inject, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { UploadClientsFileResponse } from '../dto/upload-clients-file.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { IMsaNbClientService } from '../../../external-services/msa-nb-cnb-service/interfaces/msa-nb-client-service.interface';
import { FileUpload } from 'graphql-upload-ts';
import { ErrorCodes } from '../../../common/constants/error-codes';

@Injectable()
export class UploadClientsFileService {
  private readonly logger = new Logger(UploadClientsFileService.name);
  // Maximum file size in bytes (5MB)
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private static readonly ALLOWED_MIME_TYPE = 'text/csv';

  constructor(
    @Inject(MSA_NB_CLIENT_SERVICE)
    private readonly msaNbClientService: IMsaNbClientService,
  ) {}

  private validateFileExistence(file: Promise<FileUpload> | null): void {
    if (!file) {
      throw {
        code: ErrorCodes.FILE_UPLOAD_EMPTY,
        message: 'No file provided for upload',
      };
    }
  }

  private validateFileType(mimetype: string): void {
    if (mimetype !== UploadClientsFileService.ALLOWED_MIME_TYPE) {
      throw {
        code: ErrorCodes.FILE_UPLOAD_INVALID_TYPE,
        message: 'File must be a CSV document',
        details: { providedType: mimetype },
      };
    }
  }

  private validateFileContent(buffer: Buffer, filename: string): void {
    if (buffer.length === 0) {
      throw {
        code: ErrorCodes.FILE_UPLOAD_NO_CONTENT,
        message: 'The file is empty',
        details: { filename },
      };
    }
  }

  private async processFileStream(
    fileStream: NodeJS.ReadableStream,
    filename: string,
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let currentSize = 0;

    try {
      for await (const chunk of fileStream) {
        chunks.push(chunk as Buffer);
        currentSize += (chunk as Buffer).length;

        if (currentSize > UploadClientsFileService.MAX_FILE_SIZE) {
          throw {
            code: ErrorCodes.FILE_UPLOAD_SIZE_EXCEEDED,
            message: 'File size exceeds maximum allowed (5MB)',
            details: { filename, size: currentSize },
          };
        }
      }
    } catch (error) {
      const streamError =
        error.code === ErrorCodes.FILE_UPLOAD_SIZE_EXCEEDED
          ? error
          : {
              code: ErrorCodes.FILE_UPLOAD_STREAM_ERROR,
              message: 'Error reading file stream',
              details: error,
            };
      throw streamError;
    }

    return Buffer.concat(chunks);
  }

  private async processUploadResponse(
    base64File: string,
    filename: string,
  ): Promise<UploadClientsFileResponse> {
    try {
      const uploadResponse = await lastValueFrom(
        this.msaNbClientService.uploadClientsFile(base64File),
      );

      if (!uploadResponse) {
        throw {
          code: ErrorCodes.FILE_UPLOAD_PROCESSING_ERROR,
          message: 'Failed to process clients file',
          details: { filename },
        };
      }

      return {
        status: 'SUCCESS',
        message: 'File processed successfully',
        totalProcessed: uploadResponse.totalProcessed,
        skippedRecords: uploadResponse.skippedRecords,
      };
    } catch (error) {
      if (error.code) {
        throw error;
      }
      throw {
        code: ErrorCodes.FILE_UPLOAD_SERVICE_ERROR,
        message: 'Error processing clients file',
        details: error,
      };
    }
  }

  async uploadClientsFile(
    file: Promise<FileUpload>,
  ): Promise<UploadClientsFileResponse> {
    try {
      this.validateFileExistence(file);

      const { createReadStream, mimetype, filename } = await file;
      this.validateFileType(mimetype);

      const fileStream = createReadStream();
      const buffer = await this.processFileStream(fileStream, filename);
      this.validateFileContent(buffer, filename);

      const base64File = buffer.toString('base64');
      return await this.processUploadResponse(base64File, filename);
    } catch (error) {
      this.logger.error(
        `Error uploading clients file: ${error.message}`,
        error.stack,
      );
      return ErrorHandler.handleError(error, 'upload-clients-file');
    }
  }
}
