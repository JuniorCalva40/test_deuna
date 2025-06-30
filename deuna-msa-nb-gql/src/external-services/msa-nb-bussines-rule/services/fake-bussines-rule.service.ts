import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { IBussinesRuleService } from '../interfaces/bussines-rule-service.interface';

@Injectable()
export class FakeBussinesRuleService implements IBussinesRuleService {
  private data = [
    {
      status: 'success',
      message:
        'RUC, cédula y nombre validados y coinciden con el usuario registrado.',
      data: {
        ruc: '0920563863001',
        cedula: '123456',
        nombre: 'Maria Jose Verduga Montero',
        businessOwner: 'VERDUGA MONTERO MARIA JOSE',
        businessActivity:
          'ACTIVIDADES DE DISEÑO DE LA ESTRUCTURA Y EL CONTENIDO...',
        startDate: '2012-11-28',
        address:
          'GUAYAS / GUAYAQUIL / GARCIA MORENO / JOSE MASCOTE 3910 Y VACAS GALINDO - EL ORO',
      },
    },
  ];

  getRucByIdentification(identification: string): Observable<any> {
    const data = this.data.find((d) => d.data.cedula === identification);
    return of(data);
  }
}
