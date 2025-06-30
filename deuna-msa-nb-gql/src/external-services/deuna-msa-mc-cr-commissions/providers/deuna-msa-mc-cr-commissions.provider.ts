import { HttpService } from '@nestjs/axios';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MsaMcCrCommissionsService } from '../services/deuna-msa-mc-cr-commissions.service';
export const MSA_CR_COMMISIONS_SERVICE = 'MSA_CR_COMMISIONS_SERVICE';

export const msaMcCrCommissionsProvider: Provider = {
  provide: MSA_CR_COMMISIONS_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    return new MsaMcCrCommissionsService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
