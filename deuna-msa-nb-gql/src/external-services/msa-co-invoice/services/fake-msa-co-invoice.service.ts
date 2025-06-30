import { Injectable } from '@nestjs/common';
import { IMsaCoInvoiceService } from '../interfaces/msa-co-invoice-service.interface';
import { CreateAccountDto } from '../dto/create-account.dto';
import { Observable } from 'rxjs';
import { randomBytes } from 'crypto';

@Injectable()
export class FakeMsaCoInvoiceService implements IMsaCoInvoiceService {
  private generateSecureId(): string {
    // Genera 16 bytes aleatorios y los convierte a hexadecimal
    return randomBytes(16).toString('hex');
  }

  createAccount(accountData: CreateAccountDto): Observable<any> {
    // Simular una respuesta exitosa
    const fakeResponse = {
      id: 'fake-account-id-' + this.generateSecureId(),
      status: 'CREATED',
      message: 'Account created successfully',
      ...accountData,
    };

    // Simular un retraso de red de 500ms
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next(fakeResponse);
        observer.complete();
      }, 500);
    });
  }
}
