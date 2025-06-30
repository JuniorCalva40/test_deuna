import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { BearerStrategy } from './bearer.strategy';

@Module({
  imports: [HttpModule, PassportModule.register({ defaultStrategy: 'bearer' })],
  providers: [BearerStrategy],
  exports: [PassportModule],
  controllers: [],
})
export class AuthModule {}
