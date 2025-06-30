import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  MSA_CO_INVOICE_SERVICE,
  msaCoInvoiceServiceProvider,
} from './msa-co-invoice.provider';
import { RestMsaCoInvoiceService } from '../services/rest-msa-co-invoice.service';
import { FakeMsaCoInvoiceService } from '../services/fake-msa-co-invoice.service';

describe('msaCoInvoiceServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestMsaCoInvoiceService when MSA_CO_INVOICE_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoInvoiceServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_INVOICE_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoInvoiceService);
  });

  it('should provide FakeMsaCoInvoiceService when MSA_CO_INVOICE_SERVICE_TYPE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoInvoiceServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_INVOICE_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaCoInvoiceService);
  });

  it('should provide RestMsaCoInvoiceService when MSA_CO_INVOICE_SERVICE_TYPE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoInvoiceServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_INVOICE_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoInvoiceService);
  });

  it('should inject ConfigService and HttpService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoInvoiceServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_INVOICE_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoInvoiceService);
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_CO_INVOICE_SERVICE_TYPE',
    );
  });
});
