import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FileManagerPort } from '../../../application/ports/out/repository/file-manager.port.interface';
import { FileStorageError } from '../../../application/errors/document-generation-errors';
import {
  FileManagerRequest,
  FileManagerResponse,
} from 'src/domain/types/document-types';

@Injectable()
export class FileManagerAdapter implements FileManagerPort {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async storeFile(
    fileName: string,
    fileData: FileManagerRequest,
  ): Promise<FileManagerResponse> {
    const fileManagerUrl = this.configService.get('FILE_MANAGER_URL');
    try {
      const response = await this.httpService
        .post<FileManagerResponse>(fileManagerUrl, {
          origin: 'deuna-co',
          processName: fileData.processName,
          fileName: fileName,
          mimeType: fileData.mimeType,
          tags: fileData.tags,
          description: fileData.description,
          identificationId: fileData.identificationId,
          referenceId: fileData.referenceId,
          extension: fileData.extension,
          trackingId: fileData.trackingId,
          metadata: fileData.metadata,
        })
        .toPromise();

      return {
        signedUrl: response.data.signedUrl,
      };
    } catch (error) {
      throw new FileStorageError(error.message);
    }
  }
}
