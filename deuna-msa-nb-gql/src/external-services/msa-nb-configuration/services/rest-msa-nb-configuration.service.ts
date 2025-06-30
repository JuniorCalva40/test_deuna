import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { IMsaNbConfigurationService } from '../interfaces/msa-nb-configuration-service.interface';
import { DataConfigurationInputDto } from '../dto/msa-nb-configuration-input.dto';
import { DataConfigurationResponse } from '../dto/msa-nb-configuration-response.dto';

@Injectable()
export class RestMsaNbConfigurationService
  implements IMsaNbConfigurationService
{
  private readonly logger = new Logger(RestMsaNbConfigurationService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>('MSA_NB_CONFIGURATION_URL') ||
      'http://localhost:8080';
    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 50000;
  }

  /**
   * Saves the data configuration.
   *
   * @param dataConfigurationInput - The input data configuration.
   * @returns An observable of the data configuration response.
   * @throws Error if MSA_NB_CONFIGURATION_URL is not defined in the RestMsaNbConfigurationService file.
   */
  saveDataConfiguration(
    dataConfigurationInput: DataConfigurationInputDto,
  ): Observable<DataConfigurationResponse> {
    const fullUrl = `${this.apiUrl}/api/v1/client-config`;
    return this.httpService.post(fullUrl, dataConfigurationInput).pipe(
      map((response) => response.data),
      retry(this.retry),
      timeout(this.timeout),
      catchError((error) => {
        this.logger.error(
          `saveDataConfiguration failed in RestMsaNbConfigurationService: ${error.message}`,
        );
        if (error.response) {
          this.logger.error(`Response status: ${error.response.status}`);
          this.logger.error(
            `Response data: ${JSON.stringify(error.response.data)}`,
          );
        }
        return throwError(
          () =>
            new Error(
              `Failed to method post saveDataConfiguration in RestMsaNbConfigurationService: ${error.message}`,
            ),
        );
      }),
    );
  }
}
