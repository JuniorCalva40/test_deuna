import { QueryDocumentDto } from '../../../dto/query-document.dto';
import { QueryDocumentResult } from '../../../use-cases/query-document.use-case';

export interface QueryDocumentServicePort {
  queryDocument(dto: QueryDocumentDto): Promise<QueryDocumentResult>;
}
