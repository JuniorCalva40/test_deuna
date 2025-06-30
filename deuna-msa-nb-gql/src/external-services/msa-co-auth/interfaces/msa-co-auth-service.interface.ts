import { Observable } from 'rxjs';
import { GenerateOtpInputDto } from '../dto/msa-co-auth-input.dto';
import { GenerateOtpResponseDto } from '../dto/msa-co-auth-response.dto';

export interface IMsaCoAuthService {
  validateOtp(
    businessDeviceId: string,
    requestId: string,
    otp: string,
  ): Observable<any>;

  generateOtp(input: GenerateOtpInputDto): Observable<GenerateOtpResponseDto>;
}
