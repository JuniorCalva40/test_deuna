import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import {
  msaTlTemplateGeneratorServiceProvider,
  MSA_TL_TEMPLATE_GENERATOR_SERVICE,
} from './providers/msa-tl-template-generator.provider';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [msaTlTemplateGeneratorServiceProvider],
  exports: [MSA_TL_TEMPLATE_GENERATOR_SERVICE],
})
export class MsaTlTemplateGeneratorModule {}
