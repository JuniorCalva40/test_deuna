import { Observable } from 'rxjs';

export interface IBussinesRuleService {
  getRucByIdentification(identification: string): Observable<any>;
}
