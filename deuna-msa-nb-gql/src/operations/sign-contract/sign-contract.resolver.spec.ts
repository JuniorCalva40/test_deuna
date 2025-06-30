import { Test, TestingModule } from '@nestjs/testing';
import { SignContractResolver } from './sign-contract.resolver';
import { SignContractService } from './service/sign-contract.service';
import { SignContractResponse } from './dto/sign-contract-response.dto';
import { SignContractInput } from './dto/sign-contract-input.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';

describe('SignContractResolver', () => {
  let resolver: SignContractResolver;
  let signContractService: jest.Mocked<SignContractService>;

  beforeEach(async () => {
    const mockSignContractService = {
      signContract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule], // Incluye HttpModule en imports
      providers: [
        SignContractResolver,
        ValidationAuthGuard, // Incluye ValidationAuthGuard en providers
        { provide: SignContractService, useValue: mockSignContractService },
        Reflector, // Incluye Reflector en providers
      ],
    }).compile();

    resolver = module.get<SignContractResolver>(SignContractResolver);
    signContractService = module.get(
      SignContractService,
    ) as jest.Mocked<SignContractService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('signContract', () => {
    it('should call signContractService.signContract and return the result', async () => {
      const mockInput: SignContractInput = {
        sessionId: 'test-session-id',
      };

      const expectedResponse: SignContractResponse = {
        status: 'SUCCESS',
        message: 'Contract signed successfully',
        details: {
          getClientDataResult: 'SUCCESS',
          generateContractHtmlResult: 'SUCCESS',
          createContractDocumentResult: 'SUCCESS',
          invoiceAccountResult: 'SUCCESS',
          clientStatusUpdateResult: 'SUCCESS',
          sendContractEmailResult: 'SUCCESS',
          updateOnboardingStateResult: 'SUCCESS',
          getOtpDataResult: 'SUCCESS',
        },
      };

      signContractService.signContract.mockResolvedValue(expectedResponse);

      const result = await resolver.signContract(mockInput);

      expect(signContractService.signContract).toHaveBeenCalledWith(mockInput);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from signContractService.signContract', async () => {
      const mockInput: SignContractInput = {
        sessionId: 'test-session-id',
      };

      const expectedError = new Error('Test error');

      signContractService.signContract.mockRejectedValue(expectedError);

      await expect(resolver.signContract(mockInput)).rejects.toThrow(
        expectedError,
      );
    });
  });
});
