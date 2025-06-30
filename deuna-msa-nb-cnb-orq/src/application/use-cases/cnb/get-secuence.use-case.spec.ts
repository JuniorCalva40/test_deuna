import { Test, TestingModule } from '@nestjs/testing';
import { GetSecuenceUseCase } from './get-secuence.use-case';
import {
  CNB_SECUENCE_PORT,
  CnbSecuencePort,
} from '../../ports/out/clients/cnb-secuence.port';
import { Logger } from '@deuna/tl-logger-nd';

describe('GetSecuenceUseCase', () => {
  let useCase: GetSecuenceUseCase;
  let cnbSecuencePortMock: jest.Mocked<CnbSecuencePort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    cnbSecuencePortMock = {
      getSecuence: jest.fn(),
    } as unknown as jest.Mocked<CnbSecuencePort>;

    loggerMock = {
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSecuenceUseCase,
        { provide: CNB_SECUENCE_PORT, useValue: cnbSecuencePortMock },
        { provide: Logger, useValue: loggerMock },
      ],
    }).compile();

    useCase = module.get<GetSecuenceUseCase>(GetSecuenceUseCase);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return a sequence successfully', async () => {
      // Arrange
      const mockSequence = 'SECUENCIA-001';
      cnbSecuencePortMock.getSecuence.mockResolvedValue(mockSequence);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(mockSequence);
      expect(loggerMock.log).toHaveBeenCalledWith(`init | GetSecuenceUseCase`);
      expect(cnbSecuencePortMock.getSecuence).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when getting sequence', async () => {
      // Arrange
      const error = new Error('Service not available');
      cnbSecuencePortMock.getSecuence.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(
        `Error get secuence: ${error.message}`,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `finish | error | GetSecuenceUseCase ${error.message}`,
      );
    });
  });
});
