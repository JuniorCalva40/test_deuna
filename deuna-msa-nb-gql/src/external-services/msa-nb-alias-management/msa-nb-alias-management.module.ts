import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { msaNbAliasManagementServiceProvider } from './providers/msa-nb-alias-management.provider';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaNbAliasManagementServiceProvider],
  exports: [msaNbAliasManagementServiceProvider],
})
export class MsaNbAliasManagementModule {}
