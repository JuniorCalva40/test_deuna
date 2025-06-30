import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoInvoiceService } from '../services/rest-msa-co-invoice.service';
import { FakeMsaCoInvoiceService } from '../services/fake-msa-co-invoice.service';

export const MSA_CO_INVOICE_SERVICE = 'MSA_CO_INVOICE_SERVICE';

export const msaCoInvoiceServiceProvider: Provider = {
  provide: MSA_CO_INVOICE_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const serviceType = configService.get<string>(
      'MSA_CO_INVOICE_SERVICE_TYPE',
    );

    if (serviceType === 'mock') {
      return new FakeMsaCoInvoiceService();
    }

    return new RestMsaCoInvoiceService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
