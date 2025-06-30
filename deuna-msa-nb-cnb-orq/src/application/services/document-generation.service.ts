import {
  GenerateDocumentDto,
  GenerateDocumentRespDto,
} from '../dto/generate-document.dto';
import { DocumentGenerationServicePort } from '../ports/in/services/document-generation.service.port.interface';
import { FileGeneratorPort, FILE_GENERATOR_PORT } from '../ports/out/repository/file-generator.port.interface';
import { FileManagerPort, FILE_MANAGER_PORT } from '../ports/out/repository/file-manager.port.interface';
import { GenerateDocumentUseCase } from '../use-cases/generate-document.use-case';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class DocumentGenerationService
  implements DocumentGenerationServicePort
{
  private generateDocumentUseCase: GenerateDocumentUseCase;

  constructor(
    @Inject(FILE_GENERATOR_PORT)
    private readonly fileGeneratorPort: FileGeneratorPort,

    @Inject(FILE_MANAGER_PORT)
    private readonly fileManagerPort: FileManagerPort,
  ) {
    this.generateDocumentUseCase = new GenerateDocumentUseCase(
      this.fileGeneratorPort,
      this.fileManagerPort,
    );
  }

  async generateAndSendDocument(
    dto: GenerateDocumentDto,
  ): Promise<GenerateDocumentRespDto> {
    const result = await this.generateDocumentUseCase.execute(dto);
    return {
      signedUrl: result.signedUrl,
      base64: result.base64,
    };
  }
}
