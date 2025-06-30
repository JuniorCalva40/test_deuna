import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { msaMcBoConfigurationProvider } from './providers/msa-mc-bo-configuration.provider';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaMcBoConfigurationProvider],
  exports: [msaMcBoConfigurationProvider],
})
export class DeunaMsaMcBoConfigurationModule {}
