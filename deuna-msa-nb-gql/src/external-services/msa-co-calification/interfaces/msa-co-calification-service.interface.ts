import { Observable } from 'rxjs';
import {
  CalificationInput,
  CalificationResponse,
} from '../dto/msa-co-calification.dto';

export const MSA_CO_CALIFICATION_SERVICE = 'MSA_CO_CALIFICATION_SERVICE';

export interface IMsaCoCalificationService {
  sendCalification(input: CalificationInput): Observable<CalificationResponse>;
}
