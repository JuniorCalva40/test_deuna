import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { IMsaMcBoHierarchyService } from '../interfaces/msa-mc-bo-hierarchy-service.interface';
import {
  FilterHierarchyResponseDto,
  registerStatus,
} from '../dto/filter-hierarchy.dto';

@Injectable()
export class FakeMsaMcBoHierarchyService implements IMsaMcBoHierarchyService {
  getHierarchyNodes(clientId: string): Observable<FilterHierarchyResponseDto> {
    console.log('Fake get hierarchy nodes for client:', clientId);

    const mockResponse: FilterHierarchyResponseDto = {
      items: [
        {
          id: 123,
          clientId: clientId,
          nodeType: 'COMMERCE',
          status: registerStatus.ACTIVE,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          updatedAt: new Date().toISOString(),
          updatedBy: 'system',
          origin: 'fake-service',
          children: [],
        },
      ],
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      },
      links: {
        first: '/api/v1/hierarchy?page=1',
        previous: '',
        next: '',
        last: '/api/v1/hierarchy?page=1',
      },
    };

    return of(mockResponse);
  }
}
