import { Injectable, Inject } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { UploadClientsFileResponse } from '../dto/upload-clients-file.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-client/providers/msa-nb-client-service.provider';
import { IMsaNbClientService } from '../../../external-services/msa-nb-client/interfaces/msa-nb-client-service.interface';
import { FileUpload } from 'graphql-upload-ts';

@Injectable()
export class UploadClientsFileService {
  constructor(
    @Inject(MSA_NB_CLIENT_SERVICE)
    private readonly msaNbClientService: IMsaNbClientService,
  ) {}

  async uploadClientsFile(
    file: Promise<FileUpload>,
  ): Promise<UploadClientsFileResponse> {
    try {
      const { createReadStream, mimetype } = await file;

      if (mimetype !== 'text/csv') {
        return ErrorHandler.handleError(
          'El archivo debe ser un CSV',
          'upload-clients-file',
        );
      }

      const fileStream = createReadStream();
      const chunks = [];
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const base64File = buffer.toString('base64');

      const uploadResponse = await lastValueFrom(
        this.msaNbClientService.uploadClientsFile(base64File),
      );

      if (!uploadResponse) {
        return ErrorHandler.handleError(
          'Error al cargar el archivo de clientes',
          'upload-clients-file',
        );
      }

      return {
        status: 'SUCCESS',
        message: 'Archivo procesado exitosamente',
        totalProcessed: uploadResponse.totalProcessed,
        skippedRecords: uploadResponse.skippedRecords,
      };
    } catch (error) {
      return ErrorHandler.handleError(error, 'upload-clients-file');
    }
  }
}
