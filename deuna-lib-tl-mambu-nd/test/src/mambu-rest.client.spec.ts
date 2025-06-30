import MaybeMockedDeep = jest.MaybeMockedDeep;
import { LoggerModule } from '@deuna/tl-logger-nd';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { DepositAccount, MambuException } from '../../src';
import { MambuAuthService } from '../../src/mambu-core/mambu-auth.service';
import { MambuRestService } from '../../src/mambu-core/mambu-rest.service';
import { MambuAcceptHeader } from '../../src/mambu-core/mambu.types';
import { despositAccountMock, mambuError } from '../mocks/data.mocks';

describe('Mambu RestService service', () => {
  let mambuRestClient: MambuRestService;
  let httpService: MaybeMockedDeep<HttpService>;
  let mambuAuth: MaybeMockedDeep<MambuAuthService>;
  let url = '';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MambuRestService,
        {
          provide: HttpService,
          useFactory: () => ({
            get: jest.fn(),
            post: jest.fn(),
            patch: jest.fn(),
          }),
        },
        {
          provide: MambuAuthService,
          useFactory: () => ({}),
        },
      ],
      imports: [LoggerModule.forRoot({ context: 'Account Management Module' })],
    }).compile();

    mambuRestClient = module.get<MambuRestService>(MambuRestService);
    httpService = module.get(HttpService);
    mambuAuth = module.get(MambuAuthService);
  });

  it('should be defined', () => {
    expect(mambuRestClient).toBeDefined();
    expect(httpService).toBeDefined();
    expect(mambuAuth).toBeDefined();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    mambuAuth.headers = {
      'Content-Type': 'application/json',
      Accept: MambuAcceptHeader.ACCEPT_V2,
    };
  });

  describe('Get method', () => {
    it('Should ok params with get', async () => {
      httpService.get.mockReturnValue(of({ data: despositAccountMock } as any));
      url = 'https://deunadev.sandbox.mambu.com/api/deposits/7700002628';
      const response = await mambuRestClient.get<DepositAccount>(url);

      expect(response).toEqual(despositAccountMock);
      expect(httpService.get).toHaveBeenCalledTimes(1);
      expect(httpService.get).toHaveBeenCalledWith(url, {
        headers: mambuAuth.headers,
      });
    });
    it('should fail call', async () => {
      httpService.get.mockImplementationOnce(() => {
        throw new MambuException(
          400,
          '',
          mambuError.data.errors[0].errorReason,
        );
      });
      url = 'https://deunadev.sandbox.mambu.com/api/deposits/7700002628';
      try {
        await mambuRestClient.get<DepositAccount>(url);
      } catch (e) {
        expect(e).toBeInstanceOf(MambuException);
      }
    });
  });
  describe('Post method', () => {
    it('should be post data ok ', () => {
      httpService.post.mockReturnValue(
        of({ data: despositAccountMock } as any),
      );
      url = 'https://deunadev.sandbox.mambu.com/api/deposits/7700002628';
      mambuRestClient.post<DepositAccount>(url, despositAccountMock);
      expect(httpService.post).toHaveBeenCalledTimes(1);
      expect(httpService.post).toHaveBeenCalledWith(url, despositAccountMock, {
        headers: mambuAuth.headers,
      });
    });
    it('should fail post', async () => {
      httpService.post.mockImplementationOnce(() => {
        throw new MambuException(
          400,
          '',
          mambuError.data.errors[0].errorReason,
        );
      });
      url = 'https://deunadev.sandbox.mambu.com/api/deposits/7700002628';
      try {
        await mambuRestClient.post<DepositAccount>(url);
      } catch (e) {
        expect(e).toBeInstanceOf(MambuException);
      }
    });
  });
  describe('Patch method', () => {
    it('should be patch data ok ', () => {
      httpService.patch.mockReturnValue(
        of({ data: despositAccountMock } as any),
      );
      url = 'https://deunadev.sandbox.mambu.com/api/deposits/7700002628';
      mambuRestClient.patch(url, despositAccountMock);
      expect(httpService.patch).toHaveBeenCalledTimes(1);
      expect(httpService.patch).toHaveBeenCalledWith(url, despositAccountMock, {
        headers: mambuAuth.headers,
      });
    });
    it('should fail patch', async () => {
      httpService.patch.mockImplementationOnce(() => {
        throw new MambuException(
          400,
          '',
          mambuError.data.errors[0].errorReason,
        );
      });
      url = 'https://deunadev.sandbox.mambu.com/api/deposits/7700002628';
      try {
        await mambuRestClient.patch(url, despositAccountMock);
      } catch (e) {
        expect(e).toBeInstanceOf(MambuException);
      }
    });
  });
});
