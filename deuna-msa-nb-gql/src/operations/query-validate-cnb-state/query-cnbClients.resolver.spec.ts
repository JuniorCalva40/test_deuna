import { Test, TestingModule } from '@nestjs/testing';
import { CnbClientsResolver } from './query-cnbClients.resolver';
import { CnbClientsService } from './service/query-cnbClients.service';
import { DataResponse } from './dto/validate-cnb-state.response.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { PreApprovedState, CnbState } from '../../common/constants/common';
import { EstablishmentValidateCnbOutputDto } from '../../utils/establishment.dto';
import { GetClientGuard } from '../../core/guards/get-client.guard';

describe('ClientsResolver', () => {
  let resolver: CnbClientsResolver;
  let cnbClientsService: jest.Mocked<CnbClientsService>;

  beforeEach(async () => {
    const mockClientsService = {
      validateCnbState: jest.fn().mockImplementation((input) => {
        if (!input) {
          throw new Error(
            'Customer info is required, customer info is missing',
          );
        }
        return Promise.resolve({});
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        CnbClientsResolver,
        { provide: CnbClientsService, useValue: mockClientsService },
        Reflector,
      ],
    })
      .overrideGuard(ValidationAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetClientGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<CnbClientsResolver>(CnbClientsResolver);
    cnbClientsService = module.get(
      CnbClientsService,
    ) as jest.Mocked<CnbClientsService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('validateCnbState', () => {
    const createMockContext = (customerInfo?: Partial<ClientInfo>) => ({
      req: {
        headers: {
          'client-info': customerInfo,
          'auth-token': { data: { username: 'test-user' } },
        },
      },
    });

    const validCustomerInfo: ClientInfo = {
      id: '12345',
      identification: '1234567890',
      identificationType: 'RUC',
      businessName: 'Test Business',
      comercialName: 'Frutería Analis',
      status: 'ACTIVE',
      coordinator: 'Test Coordinator',
    };

    it('should call clientsService.validateCnbState with username from auth-token and return the result', async () => {
      const expectedResponse: DataResponse = {
        status: 'SUCCESS',
        cnbState: CnbState.ACTIVE,
        preApprovedState: PreApprovedState.APPROVED,
        merchantName: 'Frutería Analis',
        remainingAttemptsOnb: 3,
        address: [
          {
            fullAddress:
              'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
            numberEstablishment: '001',
            state: 'ABIERTO',
            headquarters: 'SI',
            establishmentType: 'MAT',
            commercialName: 'Frutería Analis',
          } as EstablishmentValidateCnbOutputDto,
        ],
      };

      cnbClientsService.validateCnbState.mockResolvedValue(expectedResponse);
      const context = createMockContext(validCustomerInfo);
      const result = await resolver.validateCnbState('sessionId', context);

      expect(cnbClientsService.validateCnbState).toHaveBeenCalledWith({
        identification: validCustomerInfo.identification,
        comercialName: validCustomerInfo.comercialName,
        status: validCustomerInfo.status,
        sessionId: 'sessionId',
        trackingId: expect.any(String),
        requestId: expect.any(String),
        fullName: validCustomerInfo.businessName,
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should generate sessionId if not provided', async () => {
      const expectedResponse: DataResponse = {
        status: 'SUCCESS',
        cnbState: CnbState.ACTIVE,
        preApprovedState: PreApprovedState.APPROVED,
        merchantName: 'Frutería Analis',
        remainingAttemptsOnb: 3,
        address: [],
      };
      cnbClientsService.validateCnbState.mockResolvedValue(expectedResponse);
      const context = createMockContext(validCustomerInfo);
      await resolver.validateCnbState(null, context);

      expect(cnbClientsService.validateCnbState).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String),
        }),
      );
    });

    it('should throw error when customer info is missing', async () => {
      const context = createMockContext(undefined);

      await expect(
        resolver.validateCnbState('sessionId', context),
      ).rejects.toThrow('Customer info is required, customer info is missing');

      expect(cnbClientsService.validateCnbState).not.toHaveBeenCalled();
    });

    it('should handle errors from clientsService.validateCnbState', async () => {
      const expectedError = new Error('Test error');
      cnbClientsService.validateCnbState.mockRejectedValue(expectedError);
      const context = createMockContext(validCustomerInfo);

      await expect(
        resolver.validateCnbState('sessionId', context),
      ).rejects.toThrow(expectedError);
    });
  });
});
