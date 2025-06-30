import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { ClientsService } from './clients.service';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-client/providers/msa-nb-client-service.provider';
import { MSA_CO_COMMERCE_SERVICE } from '../../../external-services/msa-co-commerce/providers/msa-co-commerce-provider';
import { ErrorHandler } from '../../../utils/error-handler.util';

describe('ClientsService', () => {
  let service: ClientsService;
  let mockClientService: jest.Mocked<any>;
  let mockCommerceService: jest.Mocked<any>;

  beforeEach(async () => {
    mockClientService = {
      getClientByIdentification: jest.fn(),
    };
    mockCommerceService = {
      getUserByUsername: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: MSA_NB_CLIENT_SERVICE,
          useValue: mockClientService,
        },
        {
          provide: MSA_CO_COMMERCE_SERVICE,
          useValue: mockCommerceService,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);

    jest
      .spyOn(ErrorHandler, 'handleError')
      .mockImplementation((error: any, context: string) => {
        throw new Error(
          JSON.stringify({
            status: 'ERROR',
            errors: [
              {
                message: error.message || error,
                code: 'INTERNAL_SERVER_ERROR',
                context,
              },
            ],
          }),
        );
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCnbState', () => {
    it('should return ERROR status when user is not found', async () => {
      mockCommerceService.getUserByUsername.mockReturnValue(of(null));

      const result = await service.validateCnbState('testuser');

      expect(result).toEqual({
        status: 'ERROR',
        cnbState: 'NOT_FOUND',
        errors: [{ code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' }],
      });
    });

    it('should call ErrorHandler when client is not found', async () => {
      mockCommerceService.getUserByUsername.mockReturnValue(
        of({ identification: '123' }),
      );
      mockClientService.getClientByIdentification.mockReturnValue(of(null));

      await expect(service.validateCnbState('testuser')).rejects.toThrow();
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        'Client not found',
        'validate-cnb-state',
      );
    });

    it('should return SUCCESS status and PRECALIFICADO state for precalified client', async () => {
      mockCommerceService.getUserByUsername.mockReturnValue(
        of({ identification: '123' }),
      );
      mockClientService.getClientByIdentification.mockReturnValue(
        of({ status: 'PRECALIFICADO' }),
      );

      const result = await service.validateCnbState('testuser');

      expect(result).toEqual({
        status: 'SUCCESS',
        cnbState: 'PRECALIFICADO',
      });
    });

    it('should return SUCCESS status and error for non-precalified client', async () => {
      mockCommerceService.getUserByUsername.mockReturnValue(
        of({ identification: '123' }),
      );
      mockClientService.getClientByIdentification.mockReturnValue(
        of({ status: 'PENDING' }),
      );

      const result = await service.validateCnbState('testuser');

      expect(result).toEqual({
        status: 'SUCCESS',
        cnbState: 'PENDING',
        errors: [
          { code: 'NOT_PRECALIFIED', message: 'Cliente no precalificado' },
        ],
      });
    });

    it('should handle errors and call ErrorHandler', async () => {
      const mockError = new Error('Test error');
      mockCommerceService.getUserByUsername.mockReturnValue(
        throwError(() => mockError),
      );

      await expect(service.validateCnbState('testuser')).rejects.toThrow();
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        mockError,
        'validate-cnb-state',
      );
    });
  });
});
