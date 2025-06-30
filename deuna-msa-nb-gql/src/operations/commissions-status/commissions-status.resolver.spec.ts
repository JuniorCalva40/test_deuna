import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsStatusResolver } from './commissions-status.resolver';
import { CommissionsStatusService } from './service/commissions-status.service';
import { CommissionsButtonStatusResponseDto } from './dto/commissions-status.response.dto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

describe('CommissionsStatusResolver', () => {
  let resolver: CommissionsStatusResolver;
  let commissionsStatusService: { getCommissionsButtonStatus: jest.Mock };

  beforeEach(async () => {
    const mockCommissionsStatusService = {
      getCommissionsButtonStatus: jest.fn(),
    };

    const mockConfigService = { get: jest.fn() };
    const mockHttpService = { axiosRef: { get: jest.fn(), post: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsStatusResolver,
        {
          provide: CommissionsStatusService,
          useValue: mockCommissionsStatusService,
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    resolver = module.get<CommissionsStatusResolver>(CommissionsStatusResolver);
    commissionsStatusService = module.get(CommissionsStatusService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('commissionsButtonStatus', () => {
    it('should return commission button status from the service', async () => {
      const expectedResponse: CommissionsButtonStatusResponseDto = {
        status: 'OK',
        message: 'El botón de comisiones está habilitado',
      };

      commissionsStatusService.getCommissionsButtonStatus.mockResolvedValue(expectedResponse);

      const result = await resolver.commissionsButtonStatus();
      expect(result).toEqual(expectedResponse);
      expect(commissionsStatusService.getCommissionsButtonStatus).toHaveBeenCalled();
    });

    it('should propagate error if service throws', async () => {
      const expectedError = new Error('Service failure');
      commissionsStatusService.getCommissionsButtonStatus.mockRejectedValue(expectedError);

      await expect(resolver.commissionsButtonStatus()).rejects.toThrow(expectedError);
    });
  });
});