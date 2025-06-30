import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IMsaMcBoHierarchyService } from '../interfaces/msa-mc-bo-hierarchy-service.interface';
import { FilterHierarchyResponseDto } from '../dto/filter-hierarchy.dto';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class RestMsaMcBoHierarchyService implements IMsaMcBoHierarchyService {
  private readonly logger = new Logger(RestMsaMcBoHierarchyService.name);
  private readonly HIERARCHY_BASE_URL: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.HIERARCHY_BASE_URL = this.configService.get<string>(
      'HIERARCHY_SERVICE_URL',
      'http://localhost:80/hierarchy',
    );
  }

  getHierarchyNodes(clientId: string): Observable<FilterHierarchyResponseDto> {
    const url = `${this.HIERARCHY_BASE_URL}/hierarchy?clientId=${clientId}&nodeType=M&status=A&page=1&limit=10`;
    this.logger.log(
      `Fetching hierarchy nodes with clientId: ${clientId} into msa-co-hierarchy service ${url}`,
    );

    const filters = {
      clientId,
      nodeType: 'S',
      status: 'A',
      page: 1,
      limit: 10,
    };

    return this.httpService.get(url).pipe(
      map((response) => {
        this.logger.log(
          `Successfully fetched hierarchy data for filters: ${JSON.stringify(filters)}`,
        );
        return response.data;
      }),
      catchError((error) => {
        this.logger.error(
          `Error fetching hierarchy data from ${url}: ${error.message}`,
          error.stack,
        );
        throw error;
      }),
    );
  }
}
