import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import { ValidationAuthGuard } from './validation-auth.guard';
import * as headerUtils from '../../utils/header.utils';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));
jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn().mockReturnValue({
      getInfo: jest.fn().mockReturnValue({
        path: { key: 'testQuery' },
      }),
      getContext: jest.fn().mockReturnValue({
        req: {
          headers: {
            authorization: 'Bearer mock-token',
          },
        },
      }),
    }),
  },
}));

describe('ValidationAuthGuard', () => {
  let guard: ValidationAuthGuard;
  //let httpService: HttpService;
  let reflector: jest.Mocked<Reflector>;
  //let configService: ConfigService;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockRequest: any;
  let mockLogError: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        ValidationAuthGuard,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://auth-service-url'),
          },
        },
      ],
    }).compile();

    guard = module.get<ValidationAuthGuard>(ValidationAuthGuard);
    //httpService = module.get(HttpService);
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;
    //configService = module.get(ConfigService);

    mockRequest = {
      headers: {
        authorization: 'Bearer mock-token',
      },
      route: { path: '/test-path' },
    };

    mockContext = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as jest.Mocked<ExecutionContext>;

    mockLogError = jest.fn();
    guard.setLogErrorFunction(mockLogError);

    jest
      .spyOn(headerUtils, 'decodeToken')
      .mockReturnValue({ tokenType: 'LOGIN' });
  });

  // Test for missing request object (lines 69-70)
  it('should throw UnauthorizedException when request object cannot be obtained', async () => {
    const invalidContext = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(undefined),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(invalidContext)).rejects.toThrow(
      'No se pudo obtener el objeto de solicitud',
    );
  });

  // Basic authorization tests
  it('should throw UnauthorizedException if no authorization header', async () => {
    mockRequest.headers.authorization = undefined;
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // Test for invalid token format (line 74)
  it('should throw UnauthorizedException when token format is invalid', async () => {
    const mockContext2 = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(null),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as jest.Mocked<ExecutionContext>;

    await expect(guard.canActivate(mockContext2)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if token type is not in required profile', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // Test for token decoding failure (line 95)
  it('should throw UnauthorizedException when token decoding fails', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    jest.spyOn(headerUtils, 'decodeToken').mockImplementation(() => {
      throw new Error('Token decoding failed');
    });

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Invalid token',
    );
  });

  it('should allow access if requiredProfile is undefined', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const canActivate = await guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
  });

  it('should allow access if requiredProfile is an empty array', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const canActivate = await guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
  });

  it('should handle GraphQL context', async () => {
    mockContext.getType.mockReturnValue('graphql');
    reflector.getAllAndOverride.mockReturnValue(['LOGIN']);
    (guard as any).httpService.post.mockReturnValue(
      of({ data: { someData: 'value' } }),
    );

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should add auth-token and trackingId to headers on successful validation', async () => {
    reflector.getAllAndOverride.mockReturnValue(['LOGIN']);
    const mockResponse = { data: { someData: 'value' } };
    (guard as any).httpService.post.mockReturnValue(of(mockResponse));

    await guard.canActivate(mockContext);

    expect(mockRequest.headers['auth-token']).toEqual({
      ...mockResponse.data,
      tokenType: 'LOGIN',
    });
    expect(mockRequest.headers['trackingId']).toBe('mocked-uuid');
  });

  it('should handle HTTP exceptions from auth service', async () => {
    reflector.getAllAndOverride.mockReturnValue(['LOGIN']);
    const mockError = {
      response: {
        status: 401,
        data: {
          errors: [{ details: 'Unauthorized access' }],
        },
        headers: {
          'auth-signature': 'mock-signature',
          'auth-deviceid': 'mock-deviceid',
          'auth-sessionid': 'mock-sessionid',
        },
      },
    };
    (guard as any).httpService.post.mockReturnValue(
      throwError(() => mockError),
    );

    await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);
    expect(mockRequest.headers['auth-token']).toEqual({
      sessionId: 'mock-sessionid',
      deviceId: 'mock-deviceid',
      signature: 'mock-signature',
    });
  });
});
