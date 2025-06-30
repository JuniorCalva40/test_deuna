import { Test, TestingModule } from '@nestjs/testing';
import { ClientsResolver } from './clients.resolver';
import { ClientsService } from './service/clients.service';
import { DataResponse } from './dto/response.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import { createMockContext } from '../../core/test-utils/gql-context-mock';

describe('ClientsResolver', () => {
  let resolver: ClientsResolver;
  let clientsService: jest.Mocked<ClientsService>;

  beforeEach(async () => {
    const mockClientsService = {
      validateCnbState: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        ClientsResolver,
        {
          provide: ValidationAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        { provide: ClientsService, useValue: mockClientsService },
        Reflector,
      ],
    }).compile();

    resolver = module.get<ClientsResolver>(ClientsResolver);
    clientsService = module.get(ClientsService) as jest.Mocked<ClientsService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('validateCnbState', () => {
    it('should call clientsService.validateCnbState with username from auth-token and return the result', async () => {
      const userName = 'testUser';
      const expectedResponse: DataResponse = {
        status: 'SUCCESS',
        cnbState: 'ACTIVE',
      };

      // Crea un mock del contexto con el header 'auth-token'
      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                username: userName,
                personInfo: {
                  identification: '',
                },
              },
              sessionId: '',
              deviceId: '',
              signature: '',
              tokenType: '',
              role: '',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      clientsService.validateCnbState.mockResolvedValue(expectedResponse);

      const result = await resolver.validateCnbState(mockContext);

      expect(clientsService.validateCnbState).toHaveBeenCalledWith(userName);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from clientsService.validateCnbState', async () => {
      const mockContext = createMockContext();
      const expectedError = new Error('Test error');

      clientsService.validateCnbState.mockRejectedValue(expectedError);

      await expect(resolver.validateCnbState(mockContext)).rejects.toThrow(
        expectedError,
      );
    });
  });
});
