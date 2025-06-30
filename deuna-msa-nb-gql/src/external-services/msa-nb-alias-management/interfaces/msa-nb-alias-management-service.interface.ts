import { Observable } from 'rxjs';
import { GenerateDynamicQrInputDto } from '../dto/generate-dynamic-qr-input.dto';
import { CreateDynamicQrResponseDto } from '../dto/create-dynamic-qr-response.dto';
import { GetDynamicQrResponseDto } from '../dto/get-dynamic-qr-response.dto';

export interface IMsaNbAliasManagementService {
  generateDynamicQr(
    input: GenerateDynamicQrInputDto,
  ): Observable<CreateDynamicQrResponseDto>;

  getDynamicQr(transactionId: string): Observable<GetDynamicQrResponseDto>;
}
