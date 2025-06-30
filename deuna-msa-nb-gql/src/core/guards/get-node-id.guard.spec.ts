import {
  ExecutionContext,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GetNodeIdGuard } from './get-node-id.guard';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ClientInfo } from '../schema/merchat-client.schema';

describe('GetNodeIdGuard', () => {
  let guard: GetNodeIdGuard;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetNodeIdGuard,
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

    guard = module.get<GetNodeIdGuard>(GetNodeIdGuard);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should allow activation when node id is fetched successfully', async () => {
    const mockRequest = {
      headers: {
        'client-info': {
          id: 'merchant123',
        } as ClientInfo,
      },
    };

    const mockHierarchyResponse = {
      items: [{ id: 'node123' }],
    };

    const mockAxiosResponse: AxiosResponse = {
      data: mockHierarchyResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: undefined,
      },
    };

    configService.get.mockReturnValue('http://test-hierarchy-service');
    httpService.get.mockReturnValue(of(mockAxiosResponse));

    const mockExecutionContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
    expect(mockRequest.headers['node-id']).toEqual('node123');
  });

  it('should throw UnauthorizedException if merchantId is missing', async () => {
    const mockRequest = {
      headers: {
        'client-info': {
          id: null,
        } as ClientInfo,
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

  it('should throw UnauthorizedException if no nodes are found', async () => {
    const mockRequest = {
      headers: {
        'client-info': {
          id: 'merchant123',
        } as ClientInfo,
      },
    };

    const mockHierarchyResponse = {
      items: [],
    };

    const mockAxiosResponse: AxiosResponse = {
      data: mockHierarchyResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: undefined,
      },
    };

    configService.get.mockReturnValue('http://test-hierarchy-service');
    httpService.get.mockReturnValue(of(mockAxiosResponse));

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

  it('should throw HttpException if hierarchy service call fails with errors', async () => {
    const mockRequest = {
      headers: {
        'client-info': {
          id: 'merchant123',
        } as ClientInfo,
      },
    };

    configService.get.mockReturnValue('http://test-hierarchy-service');
    httpService.get.mockReturnValue(
      throwError(() => ({
        response: {
          data: { errors: [{ details: 'Service unavailable' }] },
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
        'client-info': {
          id: 'merchant123',
        } as ClientInfo,
      },
    };

    const mockHierarchyResponse = {
      items: [{ id: 'node123' }],
    };

    const mockAxiosResponse: AxiosResponse = {
      data: mockHierarchyResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: undefined,
      },
    };

    configService.get.mockReturnValue('http://test-hierarchy-service');
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
            req: mockRequest,
          }),
          getArgs: jest.fn(() => []),
          getClass: jest.fn(),
          getHandler: jest.fn(),
        }) as unknown as GqlExecutionContext,
    );

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
    expect(mockRequest.headers['node-id']).toEqual('node123');
  });
});
