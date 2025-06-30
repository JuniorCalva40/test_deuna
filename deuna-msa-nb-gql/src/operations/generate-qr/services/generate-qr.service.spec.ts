import { Test, TestingModule } from '@nestjs/testing';
import { GenerateQrService } from './generate-qr.service';
import { MSA_NB_ALIAS_MANAGEMENT_SERVICE } from '../../../external-services/msa-nb-alias-management/providers/msa-nb-alias-management.provider';
import { IMsaNbAliasManagementService } from '../../../external-services/msa-nb-alias-management/interfaces/msa-nb-alias-management-service.interface';
import { of, throwError } from 'rxjs';
import { CreateDynamicQrResponseDto } from '../../../external-services/msa-nb-alias-management/dto/create-dynamic-qr-response.dto';
import { GetDynamicQrResponseDto } from '../../../external-services/msa-nb-alias-management/dto/get-dynamic-qr-response.dto';

describe('GenerateQrService', () => {
  let service: GenerateQrService;
  let aliasManagementService: jest.Mocked<IMsaNbAliasManagementService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateQrService,
        {
          provide: MSA_NB_ALIAS_MANAGEMENT_SERVICE,
          useValue: {
            generateDynamicQr: jest.fn(),
            getDynamicQr: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GenerateQrService>(GenerateQrService);
    aliasManagementService = module.get(MSA_NB_ALIAS_MANAGEMENT_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQr', () => {
    it('should generate QR code successfully', async () => {
      const mockResponse: CreateDynamicQrResponseDto = {
        status: 'SUCCESS',
        message: 'QR code generated successfully',
        data: {
          transactionId: '12345',
          qrId: '67890',
          qrUrl: 'https://example.com/qr',
          qrBase64: 'mockBase64String',
        },
      };

      aliasManagementService.generateDynamicQr.mockReturnValue(
        of(mockResponse),
      );
      const result = await service.generateQr(
        'deviceId',
        100,
        '123456',
        'Test Business',
        '123456789',
        'merchantId',
      );

      expect(aliasManagementService.generateDynamicQr).toHaveBeenCalledWith({
        accountNumber: '123456789',
        identification: '123456',
        businessName: 'Test Business',
        deviceId: 'deviceId',
        amount: 100,
        merchantId: 'merchantId',
      });
      expect(result.status).toBe('SUCCESS');
      expect(result.data.qrBase64).toBe('mockBase64String');
    });

    it('should handle errors from aliasManagementService', async () => {
      const mockError = new Error('Failed to generate QR code');

      aliasManagementService.generateDynamicQr.mockReturnValue(
        throwError(() => mockError),
      );
      await expect(
        service.generateQr(
          'deviceId',
          100,
          '123456',
          'Test Business',
          '123456789',
          'merchantId',
        ),
      ).rejects.toThrow('Failed to generate QR code');
    });
  });

  describe('getQr', () => {
    it('should get QR code successfully', async () => {
      const mockResponse: GetDynamicQrResponseDto = {
        status: 'SUCCESS',
        message: 'QR code retrieved successfully',
        data: {
          cnbAccount: '******6243',
          amount: 16,
          transactionId: '20a06e69-ff4c-4767-9e7c-b9e6ddd2b7e3',
          status: 'COMPLETED',
          secondId: '94S1Z4VGL66U',
          peopleAccount: '******2894',
          peopleName: 'RISTIAN GEOVANNY CAZARES BALDEON',
        },
      };

      aliasManagementService.getDynamicQr.mockReturnValue(of(mockResponse));

      const result = await service.getQr(
        '20a06e69-ff4c-4767-9e7c-b9e6ddd2b7e3',
      );

      expect(aliasManagementService.getDynamicQr).toHaveBeenCalledWith(
        '20a06e69-ff4c-4767-9e7c-b9e6ddd2b7e3',
      );
      expect(result.status).toBe('SUCCESS');
      expect(result.data.transactionId).toBe(
        '20a06e69-ff4c-4767-9e7c-b9e6ddd2b7e3',
      );
    });

    it('should handle errors from aliasManagementService when getting QR', async () => {
      const mockError = new Error('Failed to retrieve QR code');

      aliasManagementService.getDynamicQr.mockReturnValue(
        throwError(() => mockError),
      );
      await expect(
        service.getQr('20a06e69-ff4c-4767-9e7c-b9e6ddd2b7e3'),
      ).rejects.toThrow('Failed to retrieve QR code');
    });
  });
});
