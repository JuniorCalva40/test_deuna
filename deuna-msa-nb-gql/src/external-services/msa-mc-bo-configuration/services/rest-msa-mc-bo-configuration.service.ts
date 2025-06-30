import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError, map } from 'rxjs';
import { IMsaMcBoConfigurationService } from '../interfaces/msa-mc-bo-configuration-service.interface';
import { GetNodeConfigResponse } from '../dto/get-node-config-response';
import { McBoConfigCnbAddressDto } from '../dto/get-config-cnb-address.dto';
@Injectable()
export class RestMsaMcBoConfigurationService
  implements IMsaMcBoConfigurationService
{
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'MSA_MC_BO_CONFIGURATION_SERVICE_URL',
      'http://localhost:8085',
    );
  }

  /**
   * Get node configuration by node id and node config code
   * @param nodeId - The node id
   * @returns The node configuration
   */
  getConfigCnbState(nodeId: string): Observable<GetNodeConfigResponse> {
    const url = `${this.baseUrl}/configuration/${nodeId}/search/NB001`;

    return this.httpService.get<GetNodeConfigResponse>(url).pipe(
      map((response) => response.data),
      catchError((error) => {
        throw new Error(`Error getting node configuration: ${error.message}`);
      }),
    );
  }

  getConfigCnbAddress(nodeId: string): Observable<McBoConfigCnbAddressDto> {
    const url = `${this.baseUrl}/configuration/${nodeId}/search/CO002`;

    return this.httpService.get<McBoConfigCnbAddressDto>(url).pipe(
      map((response) => response.data as McBoConfigCnbAddressDto),
      catchError((error) => {
        throw new Error(`Error getting node configuration: ${error.message}`);
      }),
    );
  }
  /**
   * Get node configuration by node id and config code
   * @param nodeId - The node id
   * @param configCode - The configuration code
   * @returns The node configuration
   */
  getNodeConfigByCode(
    nodeId: string,
    configCode: string,
  ): Observable<GetNodeConfigResponse> {
    const url = `${this.baseUrl}/configuration/${nodeId}/search/${configCode}`;

    return this.httpService.get<GetNodeConfigResponse>(url).pipe(
      map((response) => response.data),
      catchError((error) => {
        throw new Error(
          `Error getting node configuration for code ${configCode}: ${error.message}`,
        );
      }),
    );
  }
}
