import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestBussinesRuleService } from '../services/rest-bussines-rule.service';
import { FakeBussinesRuleService } from '../services/fake-bussines-rule.service';

export const BUSSINES_RULE_SERVICE = 'BUSSINES_RULE_SERVICE';

export const bussinesRuleServiceProvider: Provider = {
  provide: BUSSINES_RULE_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const userServiceType = configService.get<string>(
      'BUSSINES_RULE_SERVICE_TYPE',
    );

    if (userServiceType === 'mock') {
      return new FakeBussinesRuleService();
    }

    return new RestBussinesRuleService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
