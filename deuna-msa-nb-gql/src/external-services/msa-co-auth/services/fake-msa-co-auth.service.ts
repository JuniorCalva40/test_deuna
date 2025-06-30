import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { IMsaCoAuthService } from '../interfaces/msa-co-auth-service.interface';
import { GenerateOtpInputDto } from '../dto/msa-co-auth-input.dto';
import { GenerateOtpResponseDto } from '../dto/msa-co-auth-response.dto';

@Injectable()
export class FakeMsaCoAuthService implements IMsaCoAuthService {
  generateOtp(input: GenerateOtpInputDto): Observable<GenerateOtpResponseDto> {
    if (!input) {
      throw new Error('Invalid input');
    }
    // Simular un retraso de 500ms
    return new Observable((observer) => {
      setTimeout(() => {
        const fakeResponse: GenerateOtpResponseDto = {
          expirationDate: new Date(Date.now() + 5 * 60000).toISOString(), // 5 minutos en el futuro
          remainingResendAttempts: 2,
        };
        observer.next(fakeResponse);
        observer.complete();
      }, 500);
    });
  }

  validateOtp(
    businessDeviceId: string,
    requestId: string,
    otp: string,
  ): Observable<any> {
    // Simula una respuesta exitosa
    if (otp === '123456') {
      return of({ status: 'SUCCESS' });
    }

    // Simula una respuesta de error
    return of({
      message: 'OTP verification failed',
      statusCode: 403,
      errors: [
        {
          reason: 'verify_otp_failed',
          source: 'otp',
          code: 7000,
          details: 'Invalid OTP provided',
        },
      ],
    });
  }
}
