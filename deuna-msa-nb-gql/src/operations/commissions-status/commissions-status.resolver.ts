import { Resolver, Query } from '@nestjs/graphql';
import { CommissionsStatusService } from './service/commissions-status.service';
import { CommissionsButtonStatusResponseDto } from './dto/commissions-status.response.dto';
import { UseGuards } from '@nestjs/common';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import {
    ValidationAuthGuard,
    Profile,
    ProfileType,
} from '../../core/guards/validation-auth.guard';

@Resolver()
export class CommissionsStatusResolver {
    constructor(
        private readonly service: CommissionsStatusService
    ) { }

    @Profile(ProfileType.Authenticated)
    @UseGuards(ValidationAuthGuard, GetUserPersonGuard, GetClientGuard)
    @Query(() => CommissionsButtonStatusResponseDto)
    async commissionsButtonStatus(): Promise<CommissionsButtonStatusResponseDto> {
        return this.service.getCommissionsButtonStatus();
    }
}