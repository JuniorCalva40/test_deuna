jest.mock('@src/domain/utils/validator-tracking-headers-api', () => ({
  validateTrackingHeadersApi: jest.fn(),
}));
import { validateTrackingHeadersApi } from '@src/domain/utils/validator-tracking-headers-api';
import { CnbStateValidationController } from './cnb-state-validation.controller';
import { CnbStateValidationServicePort } from '@src/application/ports/in/services/cnb-state-validation.service.port';
import { Logger } from '@nestjs/common';
import { CnbStateValidationDTO } from '../../../application/dto/cnb-state-validation-request.dto';

const requestMock: CnbStateValidationDTO = {
  identification: '12345',
  isBlacklisted: false,
};

const response = {
  identification: '12345',
  status: 'found',
};
const sessionId = 'test-session-id';
const trackingId = 'test-tracking-id';
const requestId = 'test-request-id';

describe('CnbStateValidationController', () => {
  let controller: CnbStateValidationController;
  let cnbStateValidationServiceMock: jest.Mocked<CnbStateValidationServicePort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    cnbStateValidationServiceMock = {
      saveValidation: jest.fn(),
      getValidation: jest.fn(),
    } as unknown as jest.Mocked<CnbStateValidationServicePort>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    controller = new CnbStateValidationController(
      cnbStateValidationServiceMock,
      loggerMock as any,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('saveValidation', () => {
    it('should call saveValidation with correct parameters', async () => {
      cnbStateValidationServiceMock.saveValidation.mockResolvedValue(response);
      const result = await controller.saveValidation(
        requestMock,
        sessionId,
        trackingId,
        requestId,
      );
      expect(result).toEqual(response);
      expect(cnbStateValidationServiceMock.saveValidation).toHaveBeenCalledWith(
        requestMock.identification,
        requestMock,
      );
      expect(validateTrackingHeadersApi).toHaveBeenCalledWith(
        loggerMock,
        'Saving CNB State Validation',
        sessionId,
        trackingId,
        requestId,
      );
    });
  });
  describe('getValidation', () => {
    it('should call getValidation with correct parameters', async () => {
      cnbStateValidationServiceMock.getValidation.mockResolvedValue(response);
      const result = await controller.getValidation(
        requestMock.identification,
        sessionId,
        trackingId,
        requestId,
      );
      expect(result).toEqual(response);
      expect(cnbStateValidationServiceMock.getValidation).toHaveBeenCalledWith(
        requestMock.identification,
      );
      expect(validateTrackingHeadersApi).toHaveBeenCalledWith(
        loggerMock,
        'Retrieving CNB State Validation',
        sessionId,
        trackingId,
        requestId,
      );
    });
  });
});
