import { Module } from '@nestjs/common';
import { UploadClientsFileResolver } from './upload-clients-file.resolver';
import { UploadClientsFileService } from './service/upload-clients-file.service';
import { MsaNbClientModule } from '../../external-services/msa-nb-cnb-service/msa-nb-client.module';

@Module({
  imports: [MsaNbClientModule],
  providers: [UploadClientsFileResolver, UploadClientsFileService],
})
export class UploadClientsFileModule {}
