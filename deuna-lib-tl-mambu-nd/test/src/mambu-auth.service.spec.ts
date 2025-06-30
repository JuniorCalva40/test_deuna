import { Test, TestingModule } from '@nestjs/testing';
import { MAMBU_CLIENT } from '../../src/mambu-core/constants/constants';
import { MambuAuthService } from '../../src/mambu-core/mambu-auth.service';
import {
  MambuApiKeyAuthOptions,
  MambuBasiAuthOptions,
} from '../../src/mambu-core/mambu.types';

describe('MambuAuthService', () => {
  let mamaAuthService: MambuAuthService;
  let options: MambuBasiAuthOptions | MambuApiKeyAuthOptions;
  beforeEach(() => {
    options = {
      context: '',
      domain: '',
      user: 'user',
      password: 'password',
    };
  });

  it('should be defined', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MambuAuthService,
        {
          provide: MAMBU_CLIENT,
          useValue: options,
        },
      ],
    }).compile();

    mamaAuthService = module.get<MambuAuthService>(MambuAuthService);
    expect(mamaAuthService).toBeDefined();
    expect(mamaAuthService.headers['Authorization']).toEqual(
      'Basic dXNlcjpwYXNzd29yZA==',
    );
  });

  it('should be defined', async () => {
    options = {
      context: '',
      domain: '',
      apikey: 'data',
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MambuAuthService,
        {
          provide: MAMBU_CLIENT,
          useValue: options,
        },
      ],
    }).compile();

    mamaAuthService = module.get<MambuAuthService>(MambuAuthService);
    expect(mamaAuthService).toBeDefined();
    expect(mamaAuthService.headers['apikey']).toEqual('data');
  });
});
