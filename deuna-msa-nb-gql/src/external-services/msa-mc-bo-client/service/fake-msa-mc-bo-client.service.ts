import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IMsaMcBoClientService } from '../interfaces/msa-mc-bo-client.interface';
import {
  ClientDataInput,
  ClientDataResponse,
} from '../dto/msa-mc-bo-client.dto';

@Injectable()
export class FakeMsaBoMcClientService implements IMsaMcBoClientService {
  getClientData(input: ClientDataInput): Observable<ClientDataResponse> {
    if (!input) {
      throw new Error('Input is required');
    }

    return new Observable((observer) => {
      setTimeout(() => {
        const response: ClientDataResponse = {
          clientAcountId: 'test-clientAcountId',
          id: 'test-id',
        };
        observer.next(response);
        observer.complete();
      }, 500);
    });
  }
}
