import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptInterceptor } from './encrypt-response.interceptor';

describe('EncryptInterceptor', () => {
  let interceptor: EncryptInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptInterceptor],
    }).compile();

    interceptor = module.get<EncryptInterceptor>(EncryptInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should encrypt response hash', () => {
    const mockUser = {
      sessionId: 'mockSessionId',
      deviceId:
        '8c98fef4df8e877527dc15ef2635145b84f9c2bb4b64dc73b1b80f5aac8febea',
      signature:
        'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0NCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBbGtMMXVyVmpOSm9DMTRCWkxwMkENCmdIVGhqU2Jqb2x2d3QzT001am5sWmtMZm5pM2krZUVZRjZLeUhaUytPcVVBK2VkWCtrbFhDWk4zclZZWVFleFQNCkRWWExCWVUyajBZMEIzSU1CQVp6c2lTc3JEZWpQbDBiRTh4eGZ6ek13VnZxa28vbHlkREVLYnM4emdGUEtaZjkNCkd2OG5tVm5abkUxQ2JNdzgxbWxnOXJneGd5QkErckc0VVB1TVdUQWdSUk1QTXVrWDlKeUZrV0kzcGtVT2dMK1cNCjdiWnRLWnBpakNIQlJyMUp2QUd6aEtHMElQRnRUWE15eE04aGpOOVpRQXM0NHcwQVllSURMSHJpWkJ0ck9OMmYNClZ1UmpVQ1FuSldGVzByRTIycVg2QWFFNlNpbU9OckFXOTJDd3RLMFZ5aE8rMVd0ZkRxUVQ1bWs3bmhIcktFREoNCi9RSURBUUFCDQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0NCg==',
    };

    const mockData = {
      id: '291772c4-f675-4bf2-a5af-4333a013b9e1',
      name: 'Las delicias',
      staticPaymentQR: 'FC1W2WHNJV9B',
    };

    const mockRequest = {
      url: '/some/route/anyEndpoint',
      headers: {
        'auth-token': mockUser,
        data: mockData,
      },
    };

    const mockResponse = {
      header: jest.fn(),
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    const mockNext = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockNext).subscribe((data) => {
      expect(mockResponse.header).toHaveBeenCalledWith(
        'x-deuna-business-hash',
        expect.any(String),
      );
      expect(data).toEqual(mockData);
    });
  });

  it('should encrypt response hash by auth/creationsession', () => {
    const mockUser = {
      sessionId: 'mockSessionId',
      deviceId:
        '8c98fef4df8e877527dc15ef2635145b84f9c2bb4b64dc73b1b80f5aac8febea',
      signature:
        'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0NCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBbGtMMXVyVmpOSm9DMTRCWkxwMkENCmdIVGhqU2Jqb2x2d3QzT001am5sWmtMZm5pM2krZUVZRjZLeUhaUytPcVVBK2VkWCtrbFhDWk4zclZZWVFleFQNCkRWWExCWVUyajBZMEIzSU1CQVp6c2lTc3JEZWpQbDBiRTh4eGZ6ek13VnZxa28vbHlkREVLYnM4emdGUEtaZjkNCkd2OG5tVm5abkUxQ2JNdzgxbWxnOXJneGd5QkErckc0VVB1TVdUQWdSUk1QTXVrWDlKeUZrV0kzcGtVT2dMK1cNCjdiWnRLWnBpakNIQlJyMUp2QUd6aEtHMElQRnRUWE15eE04aGpOOVpRQXM0NHcwQVllSURMSHJpWkJ0ck9OMmYNClZ1UmpVQ1FuSldGVzByRTIycVg2QWFFNlNpbU9OckFXOTJDd3RLMFZ5aE8rMVd0ZkRxUVQ1bWs3bmhIcktFREoNCi9RSURBUUFCDQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0NCg==',
    };

    const mockData = {
      id: '291772c4-f675-4bf2-a5af-4333a013b9e1',
      name: 'Las delicias',
      staticPaymentQR: 'FC1W2WHNJV9B',
    };

    const mockBody = {
      publicKey: mockUser.signature,
    };

    const mockRequest = {
      url: '/some/route/auth/creationsession',
      headers: {
        'auth-token': mockUser,
        data: mockData,
      },
      body: mockBody,
    };

    const mockResponse = {
      header: jest.fn(),
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    const mockNext = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    };

    interceptor.intercept(mockExecutionContext, mockNext).subscribe((data) => {
      expect(mockResponse.header).toHaveBeenCalledWith(
        'x-deuna-business-hash',
        expect.any(String),
      );
      expect(data).toEqual(mockData);
    });
  });
});
