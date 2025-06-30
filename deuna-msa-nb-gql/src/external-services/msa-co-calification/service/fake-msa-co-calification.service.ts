import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IMsaCoCalificationService } from '../interfaces/msa-co-calification-service.interface';
import {
  CalificationInput,
  CalificationResponse,
} from '../dto/msa-co-calification.dto';

@Injectable()
export class FakeMsaCoCalificationService implements IMsaCoCalificationService {
  sendCalification(input: CalificationInput): Observable<CalificationResponse> {
    if (!input) {
      throw new Error('Input is required');
    }

    // Simular un retraso de 500ms
    return new Observable((observer) => {
      setTimeout(() => {
        const response: CalificationResponse = {
          status: 'success',
          message: 'Calification sent successfully',
        };
        observer.next(response);
        observer.complete();
      }, 500);
    });
  }
}
