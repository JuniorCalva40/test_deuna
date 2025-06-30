import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { msaTlOpensearchManagerProvider } from './providers/msa-tl-opensearch-manager.provider';
import { MsaTlOpensearchManagerService } from './services/msa-tl-opensearch-manager.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaTlOpensearchManagerProvider, MsaTlOpensearchManagerService],
  exports: [msaTlOpensearchManagerProvider],
})
export class MsaTlOpensearchManagerModule {}
