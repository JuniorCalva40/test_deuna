import { Test, TestingModule } from '@nestjs/testing';
import { ResendOtpResolver } from './resend-otp.resolver';
import { ResendOtpService } from './service/resend-otp.service';
import { ResendOtpInput, ResendOtpResponse } from './dto/resend-otp.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';

describe('ResendOtpResolver', () => {
  let resolver: ResendOtpResolver;
  let service: ResendOtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule], // Incluye HttpModule en imports
      providers: [
        ValidationAuthGuard, // Incluye ValidationAuthGuard en providers
        ResendOtpResolver,
        {
          provide: ResendOtpService,
          useValue: {
            resendOtp: jest.fn(),
          },
        },
        Reflector, // Incluye Reflector en providers
      ],
    }).compile();

    resolver = module.get<ResendOtpResolver>(ResendOtpResolver);
    service = module.get<ResendOtpService>(ResendOtpService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('resendOtp', () => {
    it('should call service.resendOtp and return the result', async () => {
      const input: ResendOtpInput = { sessionId: 'test-session-id' };
      const expectedResponse: ResendOtpResponse = {
        message: 'OTP resent successfully',
        expirationDate: '2023-05-01T12:00:00Z',
        remainingResendAttempts: 2,
        status: 'SUCCESS',
      };

      jest.spyOn(service, 'resendOtp').mockResolvedValue(expectedResponse);

      const result = await resolver.resendOtp(input);

      expect(service.resendOtp).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedResponse);
    });
  });
});
