import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry, timeout } from 'rxjs/operators';
import { IMsaTlTemplateGeneratorService } from '../interfaces/msa-tl-template-generator-service.interface';
import {
  TemplateGeneratorDto,
  TemplateGeneratorResponseDto,
} from '../dto/msa-tl-template-generator.dto';

@Injectable()
export class RestMsaTlTemplateGeneratorService
  implements IMsaTlTemplateGeneratorService
{
  private readonly logger = new Logger(RestMsaTlTemplateGeneratorService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>('MSA_TL_TEMPLATE_GENERATOR_URL') ||
      'http://localhost:8080';
    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 50000;
  }

  generateTemplate(
    template: TemplateGeneratorDto,
    headers?: { trackingId?: string },
  ): Observable<TemplateGeneratorResponseDto> {
    const fullUrl = `${this.apiUrl}/template/generator`;
    const payload = {
      templateArray: [
        {
          templateName: template.templateName,
          templatePath: template.templatePath,
          dynamicData: template.dynamicData,
        },
      ],
    };

    const requestHeaders = {
      'Content-Type': 'application/json',
      ...(headers?.trackingId && { trackingId: headers.trackingId }),
    };

    return this.httpService
      .post<string[]>(fullUrl, payload, {
        headers: requestHeaders,
        timeout: 10000, // 10 seconds timeout
      })
      .pipe(
        map((response) => ({
          generatedHtml: response.data,
        })),
        timeout(15000), // 15 seconds overall timeout
        retry(3), // Retry 3 times
        catchError((error) => {
          this.logger.error(
            `Failed to generate template in RestMsaTlTemplateGeneratorService: ${error.message}`,
            error.stack,
          );
          if (error.response) {
            this.logger.error(
              `Response status: ${error.response.status}`,
              error.response.data,
            );
          }
          return throwError(
            () =>
              new Error(
                `Failed to generate template. Please try again. ${error.message}`,
              ),
          );
        }),
      );
  }
}
