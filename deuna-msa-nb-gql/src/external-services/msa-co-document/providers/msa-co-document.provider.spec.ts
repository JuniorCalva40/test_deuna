import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  MSA_CO_DOCUMENT_SERVICE,
  msaCoDocumentServiceProvider,
} from './msa-co-document.provider';
import { RestMsaCoDocumentService } from '../services/rest-msa-co-document.service';
import { FakeMsaCoDocumentService } from '../services/fake-msa-co-document.service';

describe('msaCoDocumentServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestMsaCoDocumentService when MSA_CO_DOCUMENT_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoDocumentServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_DOCUMENT_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoDocumentService);
  });

  it('should provide FakeMsaCoDocumentService when MSA_CO_DOCUMENT_SERVICE_TYPE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoDocumentServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_DOCUMENT_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaCoDocumentService);
  });

  it('should provide RestMsaCoDocumentService when MSA_CO_DOCUMENT_SERVICE_TYPE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoDocumentServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_DOCUMENT_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoDocumentService);
  });

  it('should inject ConfigService and HttpService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoDocumentServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_DOCUMENT_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoDocumentService);
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_CO_DOCUMENT_SERVICE_TYPE',
    );
  });
});
