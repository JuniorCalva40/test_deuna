import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import { GenerateQrResolver } from './generate-qr.resolver';
import { GenerateQrService } from './services/generate-qr.service';
import { ValidationAuthGuard } from './../../core/guards/validation-auth.guard';
import { GetUserPersonGuard } from './../../core/guards/get-user.guard';
import { createMockContext } from '../../core/test-utils/gql-context-mock';
import { ErrorCodes } from '../../common/constants/error-codes';
import { GetClientGuard } from '../../core/guards/get-client.guard';

describe('GenerateQrResolver', () => {
  let resolver: GenerateQrResolver;
  let service: GenerateQrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        GenerateQrResolver,
        {
          provide: GenerateQrService,
          useValue: {
            generateQr: jest.fn().mockResolvedValue({
              status: 'SUCCESS',
              data: {
                qrBase64: 'mockBase64String',
                transactionId: 'txn123',
                qrUrl: 'https://example.com/qr',
                qrId: 'qr123',
              },
            }),
            getQr: jest.fn().mockResolvedValue({
              status: 'SUCCESS',
              data: {
                cnbAccount: '******6243',
                amount: 16,
                transactionId: 'txn123',
                status: 'COMPLETED',
                secondId: '94S1Z4VGL66U',
                peopleAccount: '******2894',
                peopleName: 'RISTIAN GEOVANNY CAZARES BALDEON',
              },
            }),
          },
        },
        ValidationAuthGuard,
        GetUserPersonGuard,
        GetClientGuard,
        Reflector,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                MSA_CO_AUTH_URL: 'http://mock-auth-url',
                AUTH0_NAMESPACE: 'http://mock.namespace',
                'httpClient.retry': 3,
                'httpClient.timeout': 5000,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    resolver = module.get<GenerateQrResolver>(GenerateQrResolver);
    service = module.get<GenerateQrService>(GenerateQrService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('qrGenerator', () => {
    it('should call service and return QR code', async () => {
      const input = { amount: '100' };
      const userName = 'testUser';
      const identification = '123456';
      const deviceId = 'testDeviceId';
      const merchantId = 'e941991b-1ad4-4803-ae14-59c6619c881b';
      const clientAccountId = '88000000091';
      const businessName = 'Helado Bueno DEV';

      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                ip: '0.0.0.0',
                username: userName,
                personInfo: {
                  identification: identification,
                },
              },
              sessionId: '',
              deviceId: deviceId,
              signature: '',
              tokenType: '',
              role: '',
            },
            'client-info': {
              id: merchantId,
              clientAcountId: clientAccountId,
              cifAccount: '1599607',
              identification: '0990752508001',
              identificationType: 'RUC',
              businessName: businessName,
              comercialName: 'Helado bueno',
              status: 'ACTIVE',
              coordinator: 'jchurovi@pichincha.com',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      const result = await resolver.qrGenerator(input, mockContext);

      expect(service.generateQr).toHaveBeenCalledWith(
        deviceId,
        input.amount,
        identification,
        businessName,
        clientAccountId,
        merchantId,
      );
      expect(result.status).toBe('SUCCESS');
      expect(result.qrBase64).toBe('mockBase64String');
      expect(result.transactionId).toBe('txn123');
      expect(result.qrUrl).toBe('https://example.com/qr');
      expect(result.qrId).toBe('qr123');
    });

    it('should throw error when identification is missing in auth token', async () => {
      const input = { amount: '100' };
      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                ip: '0.0.0.0',
                username: 'testUser',
                personInfo: {},
              },
              deviceId: 'testDeviceId',
              sessionId: '',
              signature: '',
              tokenType: '',
              role: '',
            },
            'client-info': {
              id: 'e941991b-1ad4-4803-ae14-59c6619c881b',
              clientAcountId: '88000000091',
              cifAccount: '1599607',
              identification: '0990752508001',
              identificationType: 'RUC',
              businessName: 'Helado Bueno DEV',
              comercialName: 'Helado bueno',
              status: 'ACTIVE',
              coordinator: 'jchurovi@pichincha.com',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      await expect(resolver.qrGenerator(input, mockContext)).rejects.toThrow(
        'User identification not found in auth token',
      );
    });

    it('should throw error when deviceId is missing in auth token', async () => {
      const input = { amount: '100' };
      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                ip: '0.0.0.0',
                username: 'testUser',
                personInfo: {
                  identification: '123456',
                },
              },
              deviceId: null,
              sessionId: '',
              signature: '',
              tokenType: '',
              role: '',
            },
            'client-info': {
              id: 'e941991b-1ad4-4803-ae14-59c6619c881b',
              clientAcountId: '88000000091',
              cifAccount: '1599607',
              identification: '0990752508001',
              identificationType: 'RUC',
              businessName: 'Helado Bueno DEV',
              comercialName: 'Helado bueno',
              status: 'ACTIVE',
              coordinator: 'jchurovi@pichincha.com',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      await expect(resolver.qrGenerator(input, mockContext)).rejects.toThrow(
        'Device ID not found in auth token',
      );
    });

    it('should throw error when client-info is missing', async () => {
      const input = { amount: '100' };
      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                ip: '0.0.0.0',
                username: 'testUser',
                personInfo: {
                  identification: '123456',
                },
              },
              deviceId: 'test-device-id',
              sessionId: 'session-id',
              signature: 'signature',
              tokenType: 'Bearer',
              role: 'user',
            },
            'client-info': null,
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      await expect(resolver.qrGenerator(input, mockContext)).rejects.toThrow(
        'Merchant ID not found in client info',
      );
    });

    it('should throw error when auth token is null', async () => {
      const input = { amount: '100' };
      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': null,
            'client-info': {
              id: 'e941991b-1ad4-4803-ae14-59c6619c881b',
              clientAcountId: '88000000091',
              cifAccount: '1599607',
              identification: '0990752508001',
              identificationType: 'RUC',
              businessName: 'Helado Bueno DEV',
              comercialName: 'Helado bueno',
              status: 'ACTIVE',
              coordinator: 'jchurovi@pichincha.com',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      try {
        await resolver.qrGenerator(input, mockContext);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.extensions.errorResponse.errors[0].code).toBe(
          ErrorCodes.AUTH_USER_NOT_FOUND,
        );
        expect(error.extensions.errorResponse.errors[0].message).toBe(
          'User identification not found in auth token',
        );
      }
    });
  });

  describe('cnbQrInfo', () => {
    it('should call service and return QR info', async () => {
      const input = { transactionId: 'txn123' };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                ip: '0.0.0.0',
                username: 'testUser',
                personInfo: {
                  identification: '123456',
                },
              },
              deviceId: 'testDeviceId',
              sessionId: '',
              signature: '',
              tokenType: '',
              role: '',
            },
            'client-info': {
              id: 'e941991b-1ad4-4803-ae14-59c6619c881b',
              clientAcountId: '88000000091',
              cifAccount: '1599607',
              identification: '0990752508001',
              identificationType: 'RUC',
              businessName: 'Helado Bueno DEV',
              comercialName: 'Helado bueno',
              status: 'ACTIVE',
              coordinator: 'jchurovi@pichincha.com',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      const result = await resolver.cnbQrInfo(input);

      expect(service.getQr).toHaveBeenCalledWith(input.transactionId);
      expect(result.status).toBe('COMPLETED');
      expect(result.cnbAccount).toBe('******6243');
      expect(result.amount).toBe(16);
      expect(result.peopleAccount).toBe('******2894');
      expect(result.peopleName).toBe('RISTIAN GEOVANNY CAZARES BALDEON');
    });
  });
});
