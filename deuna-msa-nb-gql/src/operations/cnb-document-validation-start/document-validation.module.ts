import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DocumentValidationResolver } from './document-validation.resolver';
import { DocumentValidationService } from './service/document-validation.service';
import { MsaNbCnbOrqModule } from '../../external-services/msa-nb-cnb-orq/msa-nb-cnb-orq.module';
import { LoggerModule } from '@deuna/tl-logger-nd';
import { SERVICE_NAME } from '../../common/constants/common';

@Module({
  imports: [
    HttpModule,
    LoggerModule.forRoot({
      context: `${SERVICE_NAME} - DocumentValidationModule`,
    }),
    MsaNbCnbOrqModule,
    HttpModule,
  ],
  providers: [DocumentValidationResolver, DocumentValidationService],
})
export class DocumentValidationModule {}
