import { Module } from '@nestjs/common';
import { CommissionsStatusResolver } from './commissions-status.resolver';
import { CommissionsStatusService } from './service/commissions-status.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [CommissionsStatusResolver, CommissionsStatusService],
})
export class CommissionsStatusModule {}