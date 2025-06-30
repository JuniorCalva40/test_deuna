import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FileGeneratorPort } from '../../../application/ports/out/repository/file-generator.port.interface';
import { FileGenerationError } from '../../../application/errors/document-generation-errors';
import {
  FileGeneratorMetadata,
  FileGeneratorResponse,
} from '@src/domain/types/document-types';

@Injectable()
export class FileGeneratorAdapter implements FileGeneratorPort {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async generateFile(
    content: string,
    fileName: string,
    trackingId: string,
    mimeType: string,
    extension: string,
    processName: string,
    metadata: FileGeneratorMetadata,
  ): Promise<FileGeneratorResponse> {
    const fileGeneratorUrl = this.configService.get('FILE_GENERATOR_URL');
    try {
      const response = await this.httpService
        .post<FileGeneratorResponse>(fileGeneratorUrl, {
          content: [content],
          fileName: fileName,
          mimeType: mimeType,
          extension: extension,
          trackingId: trackingId,
          referenceId: metadata.commerceId,
          origin: 'deuna-co',
          processName: processName,
          metadata: metadata,
          includeB64: true,
          shouldGenerateFile: true,
        })
        .toPromise();

      return {
        b64encoded: response.data.b64encoded,
        presignedUrl: response.data.presignedUrl,
        message: response.data.message,
      };
    } catch (error) {
      throw new FileGenerationError(error.message);
    }
  }
}
