import { Observable } from 'rxjs';
import { CreateClientInput } from '../dto/create-client.input';
import { Client } from '../dto/client.entity';
import { UploadClientsFileResponse } from '../dto/upload-client-file.entity';
import { UpdateClientCnbInput } from '../dto/update-client-cnb.input.dto';

export interface UpdateClientStatusResponse {
  id: string;
  comerceId: string;
  status: string;
}

export interface IMsaNbClientService {
  getClientByIdentification(identification: string): Observable<Client>;

  createClient(payload: CreateClientInput): Observable<Client>;

  updateClientData(
    clientId: string,
    comerceId?: string,
    ruc?: string,
  ): Observable<UpdateClientStatusResponse>;

  updateClientStatus(
    input: UpdateClientCnbInput,
  ): Observable<UpdateClientStatusResponse>;

  uploadClientsFile(file: string): Observable<UploadClientsFileResponse>;
}
