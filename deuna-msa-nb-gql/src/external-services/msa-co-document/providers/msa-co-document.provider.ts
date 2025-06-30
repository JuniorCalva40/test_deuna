import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoDocumentService } from '../services/rest-msa-co-document.service';
import { FakeMsaCoDocumentService } from '../services/fake-msa-co-document.service';

export const MSA_CO_DOCUMENT_SERVICE = 'MSA_CO_DOCUMENT_SERVICE';

export const msaCoDocumentServiceProvider: Provider = {
  provide: MSA_CO_DOCUMENT_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const serviceType = configService.get<string>(
      'MSA_CO_DOCUMENT_SERVICE_TYPE',
    );

    if (serviceType === 'mock') {
      return new FakeMsaCoDocumentService();
    }

    return new RestMsaCoDocumentService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
