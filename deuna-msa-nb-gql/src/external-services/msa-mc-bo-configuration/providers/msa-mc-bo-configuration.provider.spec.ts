import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  MSA_MC_BO_CONFIGURATION_SERVICE,
  msaMcBoConfigurationProvider,
} from './msa-mc-bo-configuration.provider';
import { RestMsaMcBoConfigurationService } from '../services/rest-msa-mc-bo-configuration.service';
import { FactoryProvider } from '@nestjs/common';

describe('MsaMcBoConfigurationProvider', () => {
  let configService: ConfigService;
  let httpService: HttpService;
  const provider = msaMcBoConfigurationProvider as FactoryProvider;

  beforeEach(() => {
    httpService = {
      get: jest.fn(),
      axiosRef: {} as any,
    } as unknown as HttpService;

    configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
  });

  it('should provide MSA_MC_BO_CONFIGURATION_SERVICE', () => {
    expect(provider.provide).toBe(MSA_MC_BO_CONFIGURATION_SERVICE);
  });

  it('should create RestMsaMcBoConfigurationService instance', () => {
    const service = provider.useFactory(configService, httpService);
    expect(service).toBeInstanceOf(RestMsaMcBoConfigurationService);
  });

  it('should inject required dependencies', () => {
    expect(provider.inject).toEqual([ConfigService, HttpService]);
  });
});
