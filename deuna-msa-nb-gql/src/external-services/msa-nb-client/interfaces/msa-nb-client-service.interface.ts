import { Observable } from 'rxjs';
import { CreateClientInput } from '../dto/create-client.input';
import { Client } from '../dto/client.entity';
import { UploadClientsFileResponse } from '../dto/upload-client-file.entity';

export interface UpdateClientStatusResponse {
  id: string;
  comerceId: string;
  status: string;
}

export interface IMsaNbClientService {
  getClientByIdentification(identification: string): Observable<Client>;
  createClient(payload: CreateClientInput): Observable<Client>;
  updateClientComerceId(
    clientId: string,
    status: string,
  ): Observable<UpdateClientStatusResponse>;
  updateClientStatus(
    clientId: string,
    status: string,
  ): Observable<UpdateClientStatusResponse>;
  uploadClientsFile(file: string): Observable<UploadClientsFileResponse>;
}
