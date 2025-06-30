import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmDataResolver } from './confirm-data.resolver';
import { ConfirmDataService } from './services/confirm-data.service';
import { ConfirmDataInputDto } from './dto/confirm-data-input.dto';
import { ConfirmDataResponseDto } from './dto/confirm-data-response.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';

describe('ConfirmDataResolver', () => {
  let resolver: ConfirmDataResolver;
  let confirmDataService: jest.Mocked<ConfirmDataService>;

  beforeEach(async () => {
    const mockConfirmDataService = {
      startConfirmData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule], // Incluye HttpModule en imports
      providers: [
        ConfirmDataResolver,
        ValidationAuthGuard, // Incluye ValidationAuthGuard en providers
        { provide: ConfirmDataService, useValue: mockConfirmDataService },
        Reflector, // Incluye Reflector en providers
      ],
    }).compile();

    resolver = module.get<ConfirmDataResolver>(ConfirmDataResolver);
    confirmDataService = module.get(
      ConfirmDataService,
    ) as jest.Mocked<ConfirmDataService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('confirmData', () => {
    it('should call confirmDataService.startConfirmData and return the result', async () => {
      const mockInput: ConfirmDataInputDto = {
        sessionId: 'test-session-id',
        establishment: {
          fullAddress: 'Test Address 123',
          numberEstablishment: '001',
        },
      };

      const expectedResponse: ConfirmDataResponseDto = {
        cnbClientId: 'test-cnb-client-id',
        sessionId: 'test-session-id',
        status: 'SUCCESS',
      };

      confirmDataService.startConfirmData.mockResolvedValue(expectedResponse);

      const result = await resolver.confirmData(mockInput);

      expect(confirmDataService.startConfirmData).toHaveBeenCalledWith(
        mockInput,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from confirmDataService.startConfirmData', async () => {
      const mockInput: ConfirmDataInputDto = {
        sessionId: 'test-session-id',
        establishment: {
          fullAddress: 'Test Address 123',
          numberEstablishment: '001',
        },
      };

      const expectedError = new Error('Test error');

      confirmDataService.startConfirmData.mockRejectedValue(expectedError);

      await expect(resolver.confirmData(mockInput)).rejects.toThrow(
        expectedError,
      );
    });
  });
});
