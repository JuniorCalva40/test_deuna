import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IMsaNbConfigurationService } from '../interfaces/msa-nb-configuration-service.interface';
import { DataConfigurationInputDto } from '../dto/msa-nb-configuration-input.dto';
import { DataConfigurationResponse } from '../dto/msa-nb-configuration-response.dto';

@Injectable()
export class FakeMsaNbConfigurationService
  implements IMsaNbConfigurationService
{
  saveDataConfiguration(
    dataConfigurationInput: DataConfigurationInputDto,
  ): Observable<DataConfigurationResponse> {
    // validate the input
    if (!dataConfigurationInput) {
      throw new Error('dataConfigurationInput is required');
    }

    // simulate succesful response
    const response: DataConfigurationResponse = {
      id: '937d1718-3636-49b4-8518-df3fde3ca248',
      enabled: true,
      configKey: 'establishment',
      configData: {
        fullAddress:
          'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
        numberEstablishment: '001',
      },
      cnbClientId: 'e6c476da-90ec-4554-af64-24e31dd60697',
    };
    return new Observable((subscriber) => {
      subscriber.next(response);
      subscriber.complete();

      return {
        unsubscribe() {},
      };
    });
  }
}
