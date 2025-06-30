import {
  ExecutionContext,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GetClientGuard } from './get-client.guard';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { GqlExecutionContext } from '@nestjs/graphql';

describe('GetClientGuard', () => {
  let guard: GetClientGuard;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetClientGuard,
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

    guard = module.get<GetClientGuard>(GetClientGuard);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should allow activation when client info is fetched successfully', async () => {
    const mockRequest = {
      headers: {
        'auth-token': {
          data: {
            personInfo: {
              identification: '12345',
            },
          },
        },
      },
    };
    const mockClient = { name: 'Test Client' };

    const mockAxiosResponse: AxiosResponse = {
      data: mockClient,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: undefined,
      },
    };

    configService.get.mockReturnValue('http://test-client-service');
    httpService.get.mockReturnValue(of(mockAxiosResponse));

    const mockExecutionContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
    expect(mockRequest.headers['client-info']).toEqual(mockClient);
  });

  it('should throw UnauthorizedException if identification is missing', async () => {
    const mockRequest = {
      headers: {
        'auth-token': {
          data: {
            personInfo: null,
          },
        },
      },
    };

    const mockExecutionContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if client service call fails', async () => {
    const mockRequest = {
      headers: {
        'auth-token': {
          data: {
            personInfo: {
              identification: '12345',
            },
          },
        },
      },
    };

    configService.get.mockReturnValue('http://test-client-service');
    httpService.get.mockReturnValue(
      throwError(() => ({
        response: {
          data: { errors: [{ details: 'Client not found' }] },
        },
      })),
    );

    const mockExecutionContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      HttpException,
    );
  });

  it('should handle GraphQL context correctly', async () => {
    const mockRequest = {
      headers: {
        'auth-token': {
          data: {
            personInfo: {
              identification: '12345',
            },
          },
        },
      },
    };

    const mockClient = { name: 'Test Client' };

    const mockAxiosResponse: AxiosResponse = {
      data: mockClient,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: undefined,
      },
    };

    configService.get.mockReturnValue('http://test-client-service');
    httpService.get.mockReturnValue(of(mockAxiosResponse));

    const mockExecutionContext = {
      getType: jest.fn(() => 'graphql'),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(() => []),
    } as unknown as ExecutionContext;

    jest.spyOn(GqlExecutionContext, 'create').mockImplementation(
      () =>
        ({
          getContext: () => ({
            req: mockRequest, // Ensure req is properly defined here
          }),
          getArgs: jest.fn(() => []),
          getClass: jest.fn(),
          getHandler: jest.fn(),
        }) as unknown as GqlExecutionContext,
    );

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
    expect(mockRequest.headers['client-info']).toEqual(mockClient);
  });
});
