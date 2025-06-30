import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoTransferOrchestrationService } from '../services/rest-msa-co-transfer-orchestration.service';
import { FakeMsaCoTransferOrchestrationService } from '../services/fake-msa-co-transfer-orchestration.service';
import {
  MSA_CO_TRANSFER_ORCHESTRATION_SERVICE,
  msaCoTransferOrchestrationServiceProvider,
} from './msa-co-transfer-orchestration-provider';

describe('msaCoTransferOrchestrationServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestMsaCoTransferOrchestrationService when MSA_CO_TRANSFER_ORCHESTRATION_SERVICE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoTransferOrchestrationServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_TRANSFER_ORCHESTRATION_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoTransferOrchestrationService);
  });

  it('should provide FakeMsaCoTransferOrchestrationService when MSA_CO_TRANSFER_ORCHESTRATION_SERVICE is "mock"', async () => {
    configService.get.mockReturnValue('mock');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoTransferOrchestrationServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_TRANSFER_ORCHESTRATION_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaCoTransferOrchestrationService);
  });

  it('should provide RestMsaCoTransferOrchestrationService when MSA_CO_TRANSFER_ORCHESTRATION_SERVICE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaCoTransferOrchestrationServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_TRANSFER_ORCHESTRATION_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoTransferOrchestrationService);
  });
});
