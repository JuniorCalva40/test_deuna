import { Observable } from 'rxjs';
import { FilterHierarchyResponseDto } from '../dto/filter-hierarchy.dto';

export interface IMsaMcBoHierarchyService {
  getHierarchyNodes(clientId: string): Observable<FilterHierarchyResponseDto>;
}
