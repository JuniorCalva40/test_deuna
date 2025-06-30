import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import {
  BUSSINES_RULE_SERVICE,
  bussinesRuleServiceProvider,
} from './providers/bussines-rules-service.provider';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [bussinesRuleServiceProvider],
  exports: [BUSSINES_RULE_SERVICE],
})
export class BussinesRuleModule {}
