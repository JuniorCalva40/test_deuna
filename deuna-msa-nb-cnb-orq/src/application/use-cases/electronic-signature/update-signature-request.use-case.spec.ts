import { Test, TestingModule } from '@nestjs/testing';
import { UpdateSignatureRequestUseCase } from './update-signature-request.use-case';
import { ElectronicSignatureUpdateDto } from '@src/application/dto/electronic-signature/electronic-signature-update.dto';
import { ElectronicSignatureStoragePort } from '@src/application/ports/out/storage/electronic-signature-storage.port';
import { ELECTRONIC_SIGNATURE_STORAGE_PORT } from '@src/domain/constants/injection.constants';

// Mock del Logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('UpdateSignatureRequestUseCase', () => {
  let useCase: UpdateSignatureRequestUseCase;
  let storagePort: ElectronicSignatureStoragePort;

  const mockUpdateDto: ElectronicSignatureUpdateDto = {
    applicantName: 'Updated Name',
    applicantLastName: 'Updated LastName',
    emailAddress: 'updated@example.com',
    cellphoneNumber: '+593987654322',
  };

  beforeEach(async () => {
    // Clean mocks before each test
    jest.clearAllMocks();

    // Create mock for storage port
    storagePort = {
      saveSignatureRequest: jest.fn(),
      updateSignatureRequest: jest.fn(),
      getSignatureRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSignatureRequestUseCase,
        {
          provide: ELECTRONIC_SIGNATURE_STORAGE_PORT,
          useValue: storagePort,
        },
      ],
    }).compile();

    useCase = module.get<UpdateSignatureRequestUseCase>(
      UpdateSignatureRequestUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update a signature request successfully', async () => {
    // Arrange
    const identificationNumber = '0987654321';
    jest
      .spyOn(storagePort, 'updateSignatureRequest')
      .mockResolvedValue(undefined);

    // Act
    await useCase.execute(identificationNumber, mockUpdateDto);

    // Assert
    expect(storagePort.updateSignatureRequest).toHaveBeenCalledWith(
      identificationNumber,
      mockUpdateDto,
    );
  });

  it('should handle errors properly', async () => {
    // Arrange
    const identificationNumber = '0987654321';
    const testError = new Error('Test error');
    jest
      .spyOn(storagePort, 'updateSignatureRequest')
      .mockRejectedValue(testError);

    // Act & Assert
    await expect(
      useCase.execute(identificationNumber, mockUpdateDto),
    ).rejects.toThrow(testError);
    expect(storagePort.updateSignatureRequest).toHaveBeenCalledWith(
      identificationNumber,
      mockUpdateDto,
    );
  });
});
