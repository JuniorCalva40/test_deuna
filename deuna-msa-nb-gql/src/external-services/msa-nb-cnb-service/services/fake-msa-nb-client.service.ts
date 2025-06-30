import { Injectable } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import {
  IMsaNbClientService,
  UpdateClientStatusResponse,
} from '../interfaces/msa-nb-client-service.interface';
import { Client } from '../dto/client.entity';
import { UploadClientsFileResponse } from '../dto/upload-client-file.entity';
import { PreApprovedState } from '../../../common/constants/common';
import { UpdateClientCnbInput } from '../dto/update-client-cnb.input.dto';

@Injectable()
export class FakeMsaNbClientService implements IMsaNbClientService {
  uploadClientsFile(file: string): Observable<UploadClientsFileResponse> {
    if (!file) {
      return throwError(() => new Error('File is required'));
    }
    return of({
      totalProcessed: 0,
      skippedRecords: [],
      message: 'Archivo procesado exitosamente',
    });
  }
  private data = [
    {
      id: '043d55f5-2a36-4a7e-a79b-c47c4db2f4ba',
      comerceId: '123456',
      email: 'test@test.com',
      identification: '123456',
      ruc: 'asdasdsa',
      businessActivities: 'asdasdas',
      businessStartDate: '2024-08-19T00:00:00.000Z',
      businessAddress: 'asdasdsa',
      phoneNumber: '12345671221',
      status: PreApprovedState.APPROVED,
    } as Client,
  ];

  getClientByIdentification(identification: string): Observable<any> {
    const client = this.data.find((u) => u.identification === identification);
    return of(client);
  }

  createClient(payload: any): Observable<any> {
    const newClient = { id: String(this.data.length + 1), ...payload };
    this.data.push(newClient);
    return of(newClient);
  }

  updateClientData(clientId: string, comerceId: string): Observable<any> {
    const index = this.data.findIndex((u) => u.id === clientId);
    if (index !== -1) {
      const fakeResponse: UpdateClientStatusResponse = {
        id: clientId,
        comerceId: comerceId,
        status: this.data[index].status,
      };
      return of(fakeResponse);
    }
    return of(null);
  }

  updateClientStatus(
    input: UpdateClientCnbInput,
  ): Observable<UpdateClientStatusResponse> {
    // Simulating a response
    const fakeResponse: UpdateClientStatusResponse = {
      id: input.clientId,
      comerceId: 'b1774d8b-fe93-4558-b107-be30ac82291a',
      status: input.status,
    };

    return of(fakeResponse);
  }
}
