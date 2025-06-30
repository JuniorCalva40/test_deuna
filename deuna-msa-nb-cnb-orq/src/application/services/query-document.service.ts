import { Injectable, Inject } from '@nestjs/common';
import { QueryDocumentServicePort } from '../ports/in/services/query-document.service.port.interface';
import { QueryDocumentDto } from '../dto/query-document.dto';
import { QueryDocumentResult } from '../use-cases/query-document.use-case';
import { QueryDocumentUseCase } from '../use-cases/query-document.use-case';
import { TemplateGeneratorPort, TEMPLATE_GENERATOR_PORT } from '../ports/out/repository/template-generator.port';
import { FileGeneratorPort, FILE_GENERATOR_PORT } from '../ports/out/repository/file-generator.port.interface';

@Injectable()
export class QueryDocumentService implements QueryDocumentServicePort {
  private queryDocumentUseCase: QueryDocumentUseCase;

  constructor(
    @Inject(TEMPLATE_GENERATOR_PORT)
    private readonly templateGeneratorPort: TemplateGeneratorPort,

    @Inject(FILE_GENERATOR_PORT)
    private readonly fileGeneratorPort: FileGeneratorPort,
  ) {
    this.queryDocumentUseCase = new QueryDocumentUseCase(
      this.templateGeneratorPort,
      this.fileGeneratorPort,
    );
  }

  async queryDocument(dto: QueryDocumentDto): Promise<QueryDocumentResult> {
    return this.queryDocumentUseCase.execute(dto);
  }
}
