import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaCoCalificationService } from './rest-msa-co-calification.service';
import {
  CalificationInput,
  CalificationResponse,
} from '../dto/msa-co-calification.dto';
import { AxiosResponse } from 'axios';

describe('RestMsaCoCalificationService', () => {
  let service: RestMsaCoCalificationService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoCalificationService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaCoCalificationService>(
      RestMsaCoCalificationService,
    );
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendCalification', () => {
    const mockInput: CalificationInput = {
      userId: 'test-user',
      rating: 5,
      context: 'test-context',
      comments: 'test-comments',
    };

    it('should send calification successfully', (done) => {
      const mockResponse: CalificationResponse = {
        status: 'success',
        message: 'Calification sent successfully',
      };
      const mockAxiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(of(mockAxiosResponse));

      service.sendCalification(mockInput).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.post).toHaveBeenCalledWith(
            'http://test-url/api/v1/feedback',
            mockInput,
          );
          done();
        },
        error: done,
      });
    });

    it('should throw error when API URL is not defined', () => {
      configService.get.mockReturnValue(undefined);

      expect(() => service.sendCalification(mockInput)).toThrow(
        'MSA_CO_CALIFICATION_URL is not defined',
      );
    });

    it('should handle API errors', (done) => {
      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(
        throwError(() => new Error('API Error')),
      );

      service.sendCalification(mockInput).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe('API Error');
          done();
        },
      });
    });
  });
});
