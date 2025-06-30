import { Test, TestingModule } from '@nestjs/testing';
import {
  MSA_MC_BO_HIERARCHY_SERVICE,
  msaMcBoHierarchyServiceProvider,
} from './msa-mc-bo-hierarchy.provider';
import { RestMsaMcBoHierarchyService } from '../services/rest-msa-mc-bo-hierarchy.service';
import { FakeMsaMcBoHierarchyService } from '../services/fake-msa-mc-bo-hierarchy.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

describe('MsaMcBoHierarchyProvider', () => {
  let module: TestingModule;
  let mockConfigService: any;
  let mockHttpService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    };

    mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      axiosRef: {
        defaults: {
          baseURL: 'http://test.com',
          headers: {},
        },
      },
    };
  });

  async function createTestingModule(serviceType: string) {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'HIERARCHY_SERVICE_TYPE') {
        return serviceType;
      }
      return null;
    });

    module = await Test.createTestingModule({
      providers: [
        msaMcBoHierarchyServiceProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    return module;
  }

  it('should be defined', async () => {
    await createTestingModule('mock');
    const service = module.get(MSA_MC_BO_HIERARCHY_SERVICE);
    expect(service).toBeDefined();
  });

  it('should provide RestMsaMcBoHierarchyService when HIERARCHY_SERVICE_TYPE is not "mock"', async () => {
    await createTestingModule('rest');
    const service = module.get(MSA_MC_BO_HIERARCHY_SERVICE);
    expect(service).toBeInstanceOf(RestMsaMcBoHierarchyService);
  });

  it('should provide FakeMsaMcBoHierarchyService when HIERARCHY_SERVICE_TYPE is "mock"', async () => {
    await createTestingModule('mock');
    const service = module.get(MSA_MC_BO_HIERARCHY_SERVICE);
    expect(service).toBeInstanceOf(FakeMsaMcBoHierarchyService);
  });
});
