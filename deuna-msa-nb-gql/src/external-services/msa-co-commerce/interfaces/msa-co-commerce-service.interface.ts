import { Observable } from 'rxjs';
import { DocumentInputDto } from '../dto/msa-co-commerce-input.dto';
import { CommerceResponseDto } from '../dto/msa-co-commerce-response.dto';

export interface IMsaCoCommerceService {
  getUserByDocument(input: DocumentInputDto): Observable<CommerceResponseDto>;
  getUserByUsername(username: string): Observable<CommerceResponseDto>;
}
