import { GenerateDocumentDto } from '../dto/generate-document.dto';
import { UseCase } from './commands/use-case.interface';
import { FileGeneratorPort } from '../ports/out/repository/file-generator.port.interface';
import { FileManagerPort } from '../ports/out/repository/file-manager.port.interface';
import {
  FileGenerationError,
  FileStorageError,
} from '../errors/document-generation-errors';
import { v4 as uuidv4 } from 'uuid';
import {
  GenerateDocumentResult,
  FileManagerRequest,
} from '../../domain/types/document-types';

export class GenerateDocumentUseCase
  implements UseCase<GenerateDocumentDto, GenerateDocumentResult>
{
  constructor(
    private readonly fileGeneratorPort: FileGeneratorPort,
    private readonly fileManagerPort: FileManagerPort,
  ) {}

  async execute(dto: GenerateDocumentDto): Promise<GenerateDocumentResult> {
    const trackingId = uuidv4();
    let generatedFile;
    try {
      generatedFile = await this.fileGeneratorPort.generateFile(
        dto.htmlTemplate,
        dto.fileName,
        trackingId,
        dto.mimeType,
        dto.extension,
        dto.processName,
        {
          documentNumber: dto.identification,
          detailAttached: dto.description,
          commerceId: dto.commerceId,
        },
      );
    } catch (error) {
      throw new FileGenerationError(error.message);
    }

    let storedFile;
    try {
      const fileManagerRequest: FileManagerRequest = {
        origin: 'deuna-co',
        processName: dto.processName,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        tags: dto.tags,
        description: dto.description,
        identificationId: dto.identification,
        referenceId: dto.commerceId,
        extension: dto.extension,
        trackingId: trackingId,
        metadata: {
          commerceId: dto.commerceId,
        },
      };
      storedFile = await this.fileManagerPort.storeFile(
        dto.fileName,
        fileManagerRequest,
      );
    } catch (error) {
      throw new FileStorageError(error.message);
    }

    return {
      signedUrl: storedFile.signedUrl,
      base64: generatedFile.base64,
      fileName: dto.fileName,
      processName: dto.processName,
      tags: dto.tags,
      mimeType: dto.mimeType,
      extension: dto.extension,
      trackingId: trackingId,
    };
  }
}
