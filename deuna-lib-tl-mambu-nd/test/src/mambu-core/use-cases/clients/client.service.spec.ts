import { Test, TestingModule } from '@nestjs/testing';
import { Client, ClientService, DepositAccountService, DetailsLevel } from '../../../../../src';
import { MAMBU_CLIENT } from '../../../../../src/mambu-core/constants/constants';
import { MambuRestService } from '../../../../../src/mambu-core/mambu-rest.service';
import { despositAccountMock } from '../../../../mocks/data.mocks';

describe('ClientService', () => {
  let service: ClientService;
  let mambuRestService: jest.Mocked<MambuRestService>;
  let depositAccountService: jest.Mocked<DepositAccountService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: MAMBU_CLIENT,
          useValue: {
            domain: 'https://domain.com',
            user: 'user',
            password: 'password',
          },
        },
        {
          provide: MambuRestService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DepositAccountService,
          useValue: {
            fetchById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ClientService);
    depositAccountService = module.get(DepositAccountService);
    mambuRestService = module.get(MambuRestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('findById', () => {
    it('should call mambuRestService.get with the correct url and params', async () => {
      const clientId = 'clientId';
      const detailsLevel = DetailsLevel.FULL;
      const client: Client = {
        addresses: [],
        assignedBranchKey: '',
        assignedCentreKey: '',
        clientRoleKey: '',
        emailAddress: '',
        encodedKey: '',
        groupKeys: [],
        groupLoanCycle: 0,
        idDocuments: [],
        loanCycle: 0,
        mobilePhone: '',
        preferredLanguage: '',
        state: '',
        id: 'clientId',
        firstName: 'John',
        lastName: 'Doe',
        creationDate: new Date(),
        lastModifiedDate: new Date(),
        approvedDate: new Date(),
      };
      const url = `https://domain.com/clients/${clientId}`;
      mambuRestService.get.mockReturnValue(Promise.resolve(client));

      const result = await service.findById(clientId, detailsLevel);

      expect(mambuRestService.get).toHaveBeenCalledWith(url, {
        params: { detailsLevel },
      });
      expect(result).toEqual(client);
    });
    it('should call mambuRestService.get with the correct url and default params', async () => {
      const clientId = 'clientId';
      const client: Client = {
        addresses: [],
        assignedBranchKey: '',
        assignedCentreKey: '',
        clientRoleKey: '',
        emailAddress: '',
        encodedKey: '',
        groupKeys: [],
        groupLoanCycle: 0,
        idDocuments: [],
        loanCycle: 0,
        mobilePhone: '',
        preferredLanguage: '',
        state: '',
        id: 'clientId',
        firstName: 'John',
        lastName: 'Doe',
        creationDate: new Date(),
        lastModifiedDate: new Date(),
        approvedDate: new Date(),
      };
      const url = `https://domain.com/clients/${clientId}`;
      mambuRestService.get.mockReturnValue(Promise.resolve(client));

      const result = await service.findById(clientId);

      expect(mambuRestService.get).toHaveBeenCalledWith(url, {
        params: { detailsLevel: DetailsLevel.BASIC },
      });
      expect(result).toEqual(client);
    })
    it('should call mambuRestService.findByAccountId with the correct url and default params', async () => {
      const accountId = '7700000001';
      const clientId = '8aa6ebc788beff790188c0049ec50104';
      const client: Client = {
        addresses: [],
        assignedBranchKey: '',
        assignedCentreKey: '',
        clientRoleKey: '',
        emailAddress: '',
        encodedKey: '',
        groupKeys: [],
        groupLoanCycle: 0,
        idDocuments: [],
        loanCycle: 0,
        mobilePhone: '',
        preferredLanguage: '',
        state: '',
        id: 'clientId',
        firstName: 'John',
        lastName: 'Doe',
        creationDate: new Date(),
        lastModifiedDate: new Date(),
        approvedDate: new Date(),
      };
      const url = `https://domain.com/clients/${clientId}`;
      mambuRestService.get.mockReturnValue(Promise.resolve(client));
      depositAccountService.fetchById.mockReturnValue(Promise.resolve(despositAccountMock));

      const result = await service.findByAccountId(accountId);

      expect(mambuRestService.get).toHaveBeenCalledWith(url, {
        params: { detailsLevel: DetailsLevel.BASIC },
      });
      expect(result).toEqual(client);
    });
  });
});
