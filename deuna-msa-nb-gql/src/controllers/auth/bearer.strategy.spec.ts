import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { UnauthorizedException } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { BearerStrategy } from './bearer.strategy';
import { JwtPayload } from './bearer.dto';
import { AxiosResponse } from 'axios';

describe('BearerStrategy', () => {
  let strategy: BearerStrategy;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const httpServiceMock = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BearerStrategy,
        { provide: HttpService, useValue: httpServiceMock },
      ],
    }).compile();

    strategy = module.get<BearerStrategy>(BearerStrategy);
    httpService = module.get(HttpService);

    // Mock process.env
    process.env.AUTH_SERVICE_URL = 'http://auth-service.example.com';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return payload for valid token', async () => {
      const mockToken = 'valid-token';
      const mockPayload: JwtPayload = {
        sub: '123',
        iss: '',
        aud: [],
        iat: 0,
        exp: 0,
        azp: '',
        scope: '',
        gty: '',
      };
      const mockResponse = { data: { payload: mockPayload } };

      httpService.post.mockReturnValue(
        of(mockResponse) as Observable<AxiosResponse<unknown, any>>,
      );

      const result = await strategy.validate(mockToken);

      expect(result).toEqual({ payload: mockPayload });
      expect(httpService.post).toHaveBeenCalledWith(
        `${process.env.AUTH_SERVICE_URL}/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        },
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const mockToken = 'invalid-token';
      const mockError = new Error('Invalid token');

      httpService.post.mockReturnValue(throwError(() => mockError));

      await expect(strategy.validate(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(httpService.post).toHaveBeenCalledWith(
        `${process.env.AUTH_SERVICE_URL}/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        },
      );
    });
  });
});
