import { Logger } from '@deuna/tl-logger-nd';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { has } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { MambuAuthService } from './mambu-auth.service';
import { MambuError, MambuErrors } from './mambu.types';
import { LogMambu } from './utils/mambu-logger';
import { MambuException } from './utils/mambu.exception';
import { PaginationDetails } from './config/fields/search-params.type';

@Injectable()
export class MambuRestService {
  constructor(
    private logger: Logger,
    private httpService: HttpService,
    private mambuAuth: MambuAuthService,
  ) { }

  @LogMambu()
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      let response = await lastValueFrom(
        this.httpService.get(url, {
          headers: this.mambuAuth.headers,
          ...config,
        }),
      );
      return response.data;
    } catch (error) {
      this.evaluateMambuBusinessError(error);
      throw error;
    }
  }

  @LogMambu()
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(url, data, {
          headers: this.mambuAuth.headers,
          ...config,
        }),
      );
      return response.data;
    } catch (error) {
      this.evaluateMambuBusinessError(error);
      throw error;
    }
  }

  @LogMambu()
  async search<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<{ data: T; paginationDetails: PaginationDetails }> {
    try {
      const response: AxiosResponse<T> = await lastValueFrom(
        this.httpService.post<T>(url, data, {
          headers: this.mambuAuth.headers,
          ...config,
        }),
      );
      return {
        data: response.data,
        paginationDetails: {
          itemsLimit: response.headers['items-limit'],
          itemsOffset: response.headers['items-offset'],
          itemsTotal: response.headers['items-total'],
        },
      };
    } catch (error) {
      this.evaluateMambuBusinessError(error);
      throw error;
    }
  }

  @LogMambu()
  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    try {
      return await lastValueFrom(
        this.httpService.patch(url, data, {
          headers: this.mambuAuth.headers,
          ...config,
        }),
      );
    } catch (error) {
      this.evaluateMambuBusinessError(error);
      throw error;
    }
  }

  private evaluateMambuBusinessError(error: any) {
    if (has(error, 'response.data.errors')) {
      const mambuError: MambuErrors = error.response.data as MambuErrors;
      const firstError: MambuError = mambuError.errors[0];
      this.logger.error(`Mambu ERROR: ${JSON.stringify(firstError)}`);
      throw new MambuException(
        firstError.errorCode,
        firstError.errorSource,
        firstError.errorReason,
      );
    }
  }
}
