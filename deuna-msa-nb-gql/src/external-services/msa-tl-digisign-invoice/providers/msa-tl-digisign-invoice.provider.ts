import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaTlDigisignInvoiceService } from '../services/rest-msa-tl-digisign-invoice.service';

export const MSA_TL_DIGISIGN_INVOICE_SERVICE =
  'MSA_TL_DIGISIGN_INVOICE_SERVICE';

export const msaTlDigisignInvoiceProvider: Provider = {
  provide: MSA_TL_DIGISIGN_INVOICE_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    return new RestMsaTlDigisignInvoiceService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
