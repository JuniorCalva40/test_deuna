import {
  CNB_STATE_VALIDATION_STORAGE_PORT,
  CnbStateValidationStoragePort,
} from '../../../application/ports/out/storage/cnb-state-validation-storage.port';
import { GetCnbStateValidationUseCase } from './get-cnb-state-validation.use-case';
import { CnbStateValidationDTO } from '../../../application/dto/cnb-state-validation-request.dto';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));
const responseMock: CnbStateValidationDTO = {
  identification: '12345',
  isBlacklisted: false,
};

describe('GetCnbStateValidationUseCase', () => {
  let useCase: GetCnbStateValidationUseCase;
  let storagePort: CnbStateValidationStoragePort;

  beforeEach(async () => {
    jest.clearAllMocks();

    storagePort = {
      getCnbStateValidation: jest.fn(),
      saveCnbStateValidation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCnbStateValidationUseCase,
        {
          provide: CNB_STATE_VALIDATION_STORAGE_PORT,
          useValue: storagePort,
        },
      ],
    }).compile();

    useCase = module.get<GetCnbStateValidationUseCase>(
      GetCnbStateValidationUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return CnbStateValidationDTO when data is found', async () => {
    const id = '12345';
    jest
      .spyOn(storagePort, 'getCnbStateValidation')
      .mockResolvedValue(responseMock);

    const result = await useCase.execute(id);

    expect(result).toEqual(responseMock);
    expect(storagePort.getCnbStateValidation).toHaveBeenCalledWith(id);
  });
});
