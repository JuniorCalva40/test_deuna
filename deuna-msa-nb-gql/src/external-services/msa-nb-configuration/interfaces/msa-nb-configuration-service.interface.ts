import { Observable } from 'rxjs';
import { DataConfigurationInputDto } from '../dto/msa-nb-configuration-input.dto';
import { DataConfigurationResponse } from '../dto/msa-nb-configuration-response.dto';

export interface IMsaNbConfigurationService {
  saveDataConfiguration(
    input: DataConfigurationInputDto,
  ): Observable<DataConfigurationResponse>;
}
