import { Observable } from 'rxjs';
import { HierarchyMetadataUpdateDto } from '../dto/hierarchy-metadata-update.dto';

export interface IHierarchyService {
  updateMetadata(data: HierarchyMetadataUpdateDto): Observable<void>;
}
