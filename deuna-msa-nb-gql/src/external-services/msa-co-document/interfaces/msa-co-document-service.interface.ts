import { Observable } from 'rxjs';
import {
  GenerateDocumentDto,
  GenerateDocumentResponseDto,
  QueryDocumentInputDto,
  QueryDocumentResponseDto,
} from '../dto/msa-co-document.dto';

export interface IMsaCoDocumentService {
  generateDocument(
    document: GenerateDocumentDto,
  ): Observable<GenerateDocumentResponseDto>;

  queryDocument(
    input: QueryDocumentInputDto,
  ): Observable<QueryDocumentResponseDto>;
}
