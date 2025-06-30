import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  MSA_TL_DIGISIGN_INVOICE_SERVICE,
  msaTlDigisignInvoiceProvider,
} from './msa-tl-digisign-invoice.provider';
import { RestMsaTlDigisignInvoiceService } from '../services/rest-msa-tl-digisign-invoice.service';

describe('msaTlDigisignInvoiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(msaTlDigisignInvoiceProvider).toBeDefined();
  });

  it('should provide an instance of RestMsaTlDigisignInvoiceService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaTlDigisignInvoiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get<RestMsaTlDigisignInvoiceService>(
      MSA_TL_DIGISIGN_INVOICE_SERVICE,
    );
    expect(service).toBeInstanceOf(RestMsaTlDigisignInvoiceService);
  });
});
