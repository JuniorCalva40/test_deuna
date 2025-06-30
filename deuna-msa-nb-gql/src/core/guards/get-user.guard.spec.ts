import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import {
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { of, throwError } from 'rxjs';
import { GetUserPersonGuard } from './get-user.guard';
import { AuthToken } from '../schema/auth-token.schema';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

jest.mock('@nestjs/graphql');

describe('GetUserPersonGuard', () => {
  let guard: GetUserPersonGuard;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserPersonGuard,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
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

    guard = module.get<GetUserPersonGuard>(GetUserPersonGuard);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    configService.get.mockReturnValue('http://user-service.example.com');
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: jest.Mocked<ExecutionContext>;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {
          'auth-token': {
            data: {
              username: 'testuser',
              personInfo: { identification: '123' },
            },
          } as AuthToken,
          trackingId: 'tracking123',
        },
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getType: jest.fn().mockReturnValue('http'),
      } as any;
    });

    it('should return true for authorized user (HTTP)', async () => {
      const mockUser = { id: '123', name: 'Test User' };
      httpService.get.mockReturnValue(
        of({ data: mockUser } as AxiosResponse<unknown, any>),
      );

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.headers['user-person']).toEqual(mockUser);
      expect(configService.get).toHaveBeenCalledWith('USER_SERVICE_URL');
      expect(httpService.get).toHaveBeenCalledWith(
        'http://user-service.example.com/user/identification/123',
        expect.any(Object),
      );
    });

    it('should return true for authorized user (GraphQL)', async () => {
      const mockUser = { id: '123', name: 'Test User' };
      httpService.get.mockReturnValue(
        of({ data: mockUser } as AxiosResponse<unknown, any>),
      );

      mockExecutionContext.getType.mockReturnValue('graphql');
      (GqlExecutionContext.create as jest.Mock).mockReturnValue({
        getContext: jest.fn().mockReturnValue({ req: mockRequest }),
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.headers['user-person']).toEqual(mockUser);
      expect(configService.get).toHaveBeenCalledWith('USER_SERVICE_URL');
    });

    it('should throw UnauthorizedException for API errors with details', async () => {
      const mockError = {
        response: {
          data: {
            errors: [{ details: 'User is blocked' }],
          },
        },
      };
      httpService.get.mockReturnValue(throwError(() => mockError));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw HttpException for other errors', async () => {
      const mockError = new Error('Network error');
      httpService.get.mockReturnValue(throwError(() => mockError));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw HttpException when request or request.headers is undefined', async () => {
      jest
        .spyOn(mockExecutionContext.switchToHttp(), 'getRequest')
        .mockReturnValue({});

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        HttpException,
      );
      expect(mockExecutionContext.switchToHttp().getRequest).toHaveBeenCalled();
    });

    it('should throw HttpException when username is not present', async () => {
      mockRequest.headers['auth-token'] = {} as AuthToken;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        HttpException,
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'the username is not present - get user person guard',
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
        }),
      );
    });
  });
});
