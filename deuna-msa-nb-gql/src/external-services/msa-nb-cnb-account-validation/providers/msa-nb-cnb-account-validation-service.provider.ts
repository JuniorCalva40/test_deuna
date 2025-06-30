import { Provider } from '@nestjs/common';
import { IMsaNbCnbAccountValidationService } from '../interfaces/msa-nb-cnb-account-validation-service.interface';
import { RestMsaNbCnbAccountValidationService } from '../services/rest-msa-nb-cnb-account-validation.service';

export const MSA_NB_CNB_ACCOUNT_VALIDATION_SERVICE =
  'MSA_NB_CNB_ACCOUNT_VALIDATION_SERVICE';

export const msaNbCnbAccountValidationServiceProvider: Provider = {
  provide: MSA_NB_CNB_ACCOUNT_VALIDATION_SERVICE,
  useClass: RestMsaNbCnbAccountValidationService,
}; 