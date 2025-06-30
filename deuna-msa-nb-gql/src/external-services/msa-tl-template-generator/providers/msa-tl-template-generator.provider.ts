import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaTlTemplateGeneratorService } from '../services/rest-msa-tl-template-generator.service';
import { FakeMsaTlTemplateGeneratorService } from '../services/fake-msa-tl-template-generator.service';

export const MSA_TL_TEMPLATE_GENERATOR_SERVICE =
  'MSA_TL_TEMPLATE_GENERATOR_SERVICE';

export const msaTlTemplateGeneratorServiceProvider: Provider = {
  provide: MSA_TL_TEMPLATE_GENERATOR_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const serviceType = configService.get<string>(
      'MSA_TL_TEMPLATE_GENERATOR_SERVICE_TYPE',
    );

    if (serviceType === 'mock') {
      return new FakeMsaTlTemplateGeneratorService();
    }

    return new RestMsaTlTemplateGeneratorService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
