import { TestingModule, Test } from '@nestjs/testing';
import {
  CnbStateValidationStoragePort,
  CNB_STATE_VALIDATION_STORAGE_PORT,
} from '../../../application/ports/out/storage/cnb-state-validation-storage.port';
import { CnbStateValidationDTO } from '../../../application/dto/cnb-state-validation-request.dto';
import { SaveCnbStateValidationUseCase } from './save-cnb-state-validation.use-case';

jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

const resuqestMock: CnbStateValidationDTO = {
  identification: '12345',
  isBlacklisted: false,
};

describe('SaveCnbStateValidationUseCase', () => {
  let useCase: SaveCnbStateValidationUseCase;
  let storagePort: CnbStateValidationStoragePort;

  beforeEach(async () => {
    jest.clearAllMocks();

    storagePort = {
      getCnbStateValidation: jest.fn(),
      saveCnbStateValidation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveCnbStateValidationUseCase,
        {
          provide: CNB_STATE_VALIDATION_STORAGE_PORT,
          useValue: storagePort,
        },
      ],
    }).compile();

    useCase = module.get<SaveCnbStateValidationUseCase>(
      SaveCnbStateValidationUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return CnbStateValidationDTO when data is found', async () => {
    const id = '12345';
    jest
      .spyOn(storagePort, 'getCnbStateValidation')
      .mockResolvedValue(undefined);

    const result = await useCase.execute(id, resuqestMock);

    expect(storagePort.saveCnbStateValidation).toHaveBeenCalledWith(
      id,
      resuqestMock,
    );
    expect(result).toBeUndefined();
  });
});
