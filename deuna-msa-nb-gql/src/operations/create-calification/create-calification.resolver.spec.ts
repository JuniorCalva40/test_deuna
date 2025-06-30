import { Test, TestingModule } from '@nestjs/testing';
import { CreateCalificationResolver } from './create-calification.resolver';
import { CreateCalificationService } from './service/create-calification.service';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import {
  CreateCalificationInput,
  CreateCalificationResponse,
} from './dto/create-calification.dto';

describe('CreateCalificationResolver', () => {
  let resolver: CreateCalificationResolver;
  let service: jest.Mocked<CreateCalificationService>;

  beforeEach(async () => {
    const mockCreateCalificationService = {
      createCalification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        ValidationAuthGuard,
        CreateCalificationResolver,
        {
          provide: CreateCalificationService,
          useValue: mockCreateCalificationService,
        },
        Reflector,
      ],
    }).compile();

    resolver = module.get<CreateCalificationResolver>(
      CreateCalificationResolver,
    );
    service = module.get(CreateCalificationService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createCalification', () => {
    const mockInput: CreateCalificationInput = {
      rating: 5,
      comments: 'test comments',
      context: 'CNB',
    };

    const mockContext = {
      req: {
        headers: {
          'auth-token': {
            data: {
              username: 'test-user-id',
            },
          },
        },
      },
    };

    const mockSuccessResponse: CreateCalificationResponse = {
      status: 'success',
    };

    it('should successfully create a calification', async () => {
      service.createCalification.mockResolvedValue(mockSuccessResponse);

      const result = await resolver.createCalification(mockInput, mockContext);

      expect(result).toEqual(mockSuccessResponse);
      expect(service.createCalification).toHaveBeenCalledWith(
        mockInput,
        'test-user-id',
      );
    });

    it('should handle service errors correctly', async () => {
      const errorResponse = {
        status: 'ERROR',
        errors: [
          {
            code: 'CALIFICATION_SERVICE_ERROR',
            message: 'Service error',
          },
        ],
      };

      service.createCalification.mockResolvedValue(errorResponse);

      const result = await resolver.createCalification(mockInput, mockContext);

      expect(result).toEqual(errorResponse);
      expect(service.createCalification).toHaveBeenCalledWith(
        mockInput,
        'test-user-id',
      );
    });
  });
});
