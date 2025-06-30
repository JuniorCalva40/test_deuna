import { Test, TestingModule } from '@nestjs/testing';
import { InitiateDepositResolver } from './initiate-deposit.resolver';
import { InitiateDepositService } from './services/initiate-deposit.service';
import { InitiateDepositResponse } from './dto/initiate-deposit-response.dto';
import { InitiateDepositInput } from './dto/initiate-deposit-input.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';

describe('InitiateDepositResolver', () => {
  let resolver: InitiateDepositResolver;
  let initiateDepositService: jest.Mocked<InitiateDepositService>;

  beforeEach(async () => {
    const mockInitiateDepositService = {
      initiateDeposit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule], // Incluye HttpModule en imports
      providers: [
        ValidationAuthGuard, // Incluye ValidationAuthGuard en providers
        InitiateDepositResolver,
        {
          provide: InitiateDepositService,
          useValue: mockInitiateDepositService,
        },
        Reflector, // Incluye Reflector en providers
      ],
    }).compile();

    resolver = module.get<InitiateDepositResolver>(InitiateDepositResolver);
    initiateDepositService = module.get(
      InitiateDepositService,
    ) as jest.Mocked<InitiateDepositService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('InitiateDeposit', () => {
    it('should call InitiateDepositService.initiateDeposit and return the result', async () => {
      const mockInput: InitiateDepositInput = {
        QRid: 'test-QR-id',
      };

      const expectedResponse: InitiateDepositResponse = {
        accountNumber: 'test-accountNumber',
        beneficiaryName: 'test-beneficiaryName',
        identification: 'test-identification',
        status: 'SUCCESS',
      };

      initiateDepositService.initiateDeposit.mockResolvedValue(
        expectedResponse,
      );

      const result = await resolver.initiateDeposit(mockInput);

      expect(initiateDepositService.initiateDeposit).toHaveBeenCalledWith(
        mockInput,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from InitiateDepositService.initiateDeposit', async () => {
      const mockInput: InitiateDepositInput = {
        QRid: 'test-QR-id',
      };

      const expectedError = new Error('Test error');

      initiateDepositService.initiateDeposit.mockRejectedValue(expectedError);

      await expect(resolver.initiateDeposit(mockInput)).rejects.toThrow(
        expectedError,
      );
    });
  });
});
