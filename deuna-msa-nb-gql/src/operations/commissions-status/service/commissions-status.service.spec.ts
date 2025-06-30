import { ConfigService } from '@nestjs/config';
import { CommissionsStatusService } from './commissions-status.service';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';

describe('CommissionsStatusService', () => {
  let service: CommissionsStatusService;
  let configService: ConfigService;

  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    configService = new ConfigService();
    service = new CommissionsStatusService(configService);

    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.restoreAllMocks();
  });

  it('should return OK if current day is within range', () => {
    const mockDate = new Date(2025, 4, 3); // 3 de mayo
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    process.env.MAX_COMMISSION_DAYS = '5';

    const result = service.getCommissionsButtonStatus();
    expect(result).toEqual({
      status: 'OK',
      message: 'El botón de comisiones está habilitado',
    });
  });

  it('should return ERROR if current day is outside the range', () => {
    const mockDate = new Date(2025, 4, 10); // 10 de mayo
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    process.env.MAX_COMMISSION_DAYS = '5';

    const result = service.getCommissionsButtonStatus();
    expect(result).toEqual({
      status: 'ERROR',
      message: 'Se habilitará el cobro los 5 primeros días del mes.',
    });
  });

  it('should call ErrorHandler.handleError when MAX_COMMISSION_DAYS is invalid (letters)', () => {
    const mockDate = new Date(2025, 4, 3);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    process.env.MAX_COMMISSION_DAYS = 'abc';

    const errorHandlerSpy = jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
      throw new Error('handled');
    });

    expect(() => service.getCommissionsButtonStatus()).toThrow('handled');
    expect(errorHandlerSpy).toHaveBeenCalledWith(
      {
        message: 'Missing or invalid MAX_COMMISSION_DAYS',
        code: ErrorCodes.SYS_CONFIG_INVALID,
        details: { envVar: 'MAX_COMMISSION_DAYS', received: 'abc' },
      },
      'GET_COMMISSIONS_BUTTON_STATUS',
    );
  });

  it('should call ErrorHandler.handleError when MAX_COMMISSION_DAYS is zero', () => {
    const mockDate = new Date(2025, 4, 1);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    process.env.MAX_COMMISSION_DAYS = '0';

    const errorHandlerSpy = jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
      throw new Error('handled');
    });

    expect(() => service.getCommissionsButtonStatus()).toThrow('handled');
    expect(errorHandlerSpy).toHaveBeenCalledWith(
      {
        message: 'Missing or invalid MAX_COMMISSION_DAYS',
        code: ErrorCodes.SYS_CONFIG_INVALID,
        details: { envVar: 'MAX_COMMISSION_DAYS', received: '0' },
      },
      'GET_COMMISSIONS_BUTTON_STATUS',
    );
  });
});