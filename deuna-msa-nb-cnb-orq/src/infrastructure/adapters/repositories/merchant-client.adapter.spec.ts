import { MerchantClientAdapter } from './merchant-client.adapter';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@deuna/tl-logger-nd';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';

describe('MerchantClientAdapter', () => {
    let adapter: MerchantClientAdapter;
    let configService: jest.Mocked<ConfigService>;
    let httpService: jest.Mocked<HttpService>;
    let logger: jest.Mocked<Logger>;

    beforeEach(() => {
        configService = {
            get: jest.fn().mockImplementation((key: string) => {
                if (key === 'BO_MERCHANT_CLIENT_SERVICE') {
                    return 'http://merchant-client-service';
                }
                return null;
            }),
        } as any;

        httpService = {
            get: jest.fn(),
        } as any;

        logger = {
            log: jest.fn(),
            error: jest.fn(),
        } as any;

        adapter = new MerchantClientAdapter(configService, httpService, logger);
    });

    it('should fetch client data successfully', async () => {
        const identification = '1234567890';
        const mockResponse: AxiosResponse = {
            data: { id: 'client-001' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {
                headers: new AxiosHeaders(), // ✅ solución correcta
            },
        };

        httpService.get.mockReturnValue(of(mockResponse));

        const result = await adapter.getClientData(identification);

        expect(httpService.get).toHaveBeenCalledWith(
            'http://merchant-client-service/client/ruc/1234567890'
        );
        expect(logger.log).toHaveBeenCalledWith(
            expect.stringContaining('init | MerchantClientAdapter | getClientData'),
        );
        expect(logger.log).toHaveBeenCalledWith(
            expect.stringContaining('finish | MerchantClientAdapter | getClientData'),
        );
        expect(result).toEqual({ clientId: 'client-001' });
    });

    it('should throw error and log when request fails', async () => {
        const identification = '9999999999';
        const error = {
            message: 'Request failed',
            response: { status: 500 },
        };

        httpService.get.mockReturnValue(throwError(() => error));

        await expect(adapter.getClientData(identification)).rejects.toThrow(
            'Failed to get merchant client data: Request failed'
        );

        expect(logger.error).toHaveBeenCalledWith(
            'error | MerchantClientAdapter | getClientData',
            error,
        );
    });

    it('should throw if BO_MERCHANT_CLIENT_SERVICE is not defined', () => {
        configService.get.mockReturnValue(undefined);

        expect(
            () =>
                new MerchantClientAdapter(
                    configService,
                    httpService,
                    logger,
                )
        ).toThrow('BO_MERCHANT_CLIENT_SERVICE is not defined');

        expect(logger.error).toHaveBeenCalledWith(
            'error | MerchantClientAdapter | constructor',
            'BO_MERCHANT_CLIENT_SERVICE is not defined',
        );
    });
});