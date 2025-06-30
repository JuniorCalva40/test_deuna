import { UseCase } from './commands/use-case.interface';
import { TemplateGeneratorPort } from '../ports/out/repository/template-generator.port';
import { FileGeneratorPort } from '../ports/out/repository/file-generator.port.interface';
import { v4 as uuidv4 } from 'uuid';
import { QueryDocumentDto } from '../dto/query-document.dto';

/**
 * Data Transfer Object for the QueryDocumentUseCase.
 *
 * @property templateName - The name of the template to use.
 * @property templatePath - The path to the template file.
 * @property dynamicData - An object containing dynamic data to be used in the template.
 */

/**
 * Result object for the QueryDocumentUseCase.
 *
 * @property base64 - The generated file in base64 format.
 */
export interface QueryDocumentResult {
  presignedUrl: string;
  b64encoded: string;
}

/**
 * Use case for generating a document from a template and dynamic data.
 */
export class QueryDocumentUseCase
  implements UseCase<QueryDocumentDto, QueryDocumentResult>
{
  constructor(
    private readonly templateGeneratorPort: TemplateGeneratorPort,
    private readonly fileGeneratorPort: FileGeneratorPort,
  ) {}

  /**
   * Executes the use case to generate a document from a template and dynamic data.
   *
   * @param dto - The input data for the use case.
   * @returns A Promise that resolves with the generated document in base64 format.
   */
  async execute(dto: QueryDocumentDto): Promise<QueryDocumentResult> {
    const htmlTemplate = await this.templateGeneratorPort.generateTemplate(
      dto.templateName,
      dto.templatePath,
    );
    const trackingId = uuidv4();
    const fileName = `${dto.templateName}_${Date.now()}.pdf`;

    const generatedFile = await this.fileGeneratorPort.generateFile(
      htmlTemplate,
      fileName,
      trackingId,
      'application/pdf',
      'pdf',
      'query-document',
      {
        templateName: dto.templateName,
      },
    );

    return {
      presignedUrl: generatedFile.presignedUrl,
      b64encoded: generatedFile.b64encoded,
    };
  }
}
