import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { ConfirmDataService } from './services/confirm-data.service';
import { ConfirmDataInputDto } from './dto/confirm-data-input.dto';
import { ConfirmDataResponseDto } from './dto/confirm-data-response.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';

@Resolver()
export class ConfirmDataResolver {
  constructor(private readonly confirmDataService: ConfirmDataService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard)
  @Mutation(() => ConfirmDataResponseDto, { name: 'confirmData' })
  async confirmData(
    @Args('input') input: ConfirmDataInputDto,
  ): Promise<ConfirmDataResponseDto> {
    return this.confirmDataService.startConfirmData(input);
  }
}
