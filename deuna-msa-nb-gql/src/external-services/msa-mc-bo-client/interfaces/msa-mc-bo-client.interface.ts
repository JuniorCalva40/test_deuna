import { Observable } from 'rxjs';
import {
  ClientDataInput,
  ClientDataResponse,
} from '../dto/msa-mc-bo-client.dto';

export interface IMsaMcBoClientService {
  getClientData(input: ClientDataInput): Observable<ClientDataResponse>;
}
