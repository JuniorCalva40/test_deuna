import {
  GenerateDocumentDto,
  GenerateDocumentRespDto,
} from '../../../../application/dto/generate-document.dto';

export interface DocumentGenerationServicePort {
  generateAndSendDocument(
    dto: GenerateDocumentDto,
  ): Promise<GenerateDocumentRespDto>;
}
