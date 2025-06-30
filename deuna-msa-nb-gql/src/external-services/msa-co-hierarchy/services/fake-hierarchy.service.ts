import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { IHierarchyService } from '../interfaces/hierarchy-service.interface';
import { HierarchyMetadataUpdateDto } from '../dto/hierarchy-metadata-update.dto';

@Injectable()
export class FakeHierarchyService implements IHierarchyService {
  updateMetadata(data: HierarchyMetadataUpdateDto): Observable<void> {
    console.log('Fake hierarchy metadata update:', data);
    return of(undefined);
  }
}
