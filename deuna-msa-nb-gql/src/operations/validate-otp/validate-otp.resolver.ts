import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ValidateOtpService } from './service/validate-otp.service';
import {
  ValidateOtpInputDto,
  ValidateOtpResponseDto,
} from './dto/validate-otp.dto';

@Resolver()
export class ValidateOtpResolver {
  constructor(private readonly validateOtpService: ValidateOtpService) {}

  @Mutation(() => ValidateOtpResponseDto)
  async validateOtp(
    @Args('input') input: ValidateOtpInputDto,
  ): Promise<ValidateOtpResponseDto> {
    return this.validateOtpService.validateOtp(input);
  }
}
