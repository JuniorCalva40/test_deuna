import { Test, TestingModule } from '@nestjs/testing';
import { FakeBussinesRuleService } from './fake-bussines-rule.service';
import { lastValueFrom } from 'rxjs';

describe('FakeBussinesRuleService', () => {
  let service: FakeBussinesRuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FakeBussinesRuleService],
    }).compile();

    service = module.get<FakeBussinesRuleService>(FakeBussinesRuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRucByIdentification', () => {
    it('should return data for a valid identification', async () => {
      const result = await lastValueFrom(
        service.getRucByIdentification('123456'),
      );
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.data.cedula).toBe('123456');
      expect(result.data.ruc).toBe('0920563863001');
      expect(result.data.nombre).toBe('Maria Jose Verduga Montero');
    });

    it('should return undefined for an invalid identification', async () => {
      const result = await lastValueFrom(
        service.getRucByIdentification('999999'),
      );
      expect(result).toBeUndefined();
    });
  });
});
