import { Test, TestingModule } from '@nestjs/testing';
import { QueryDocumentResolver } from './query-document.resolver';
import { QueryDocumentService } from './services/query-document.service';
import { QueryDocumentInput } from './dto/query-document-input.dto';
import { QueryDocumentResponse } from './dto/query-document-response.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';

describe('QueryDocumentResolver', () => {
  let resolver: QueryDocumentResolver;
  let queryDocumentService: jest.Mocked<QueryDocumentService>;

  beforeEach(async () => {
    const mockQueryDocumentService = {
      queryDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule], // Incluye HttpModule en imports
      providers: [
        ValidationAuthGuard, // Incluye ValidationAuthGuard en providers
        QueryDocumentResolver,
        { provide: QueryDocumentService, useValue: mockQueryDocumentService },
        Reflector, // Incluye Reflector en providers
      ],
    }).compile();

    resolver = module.get<QueryDocumentResolver>(QueryDocumentResolver);
    queryDocumentService = module.get(
      QueryDocumentService,
    ) as jest.Mocked<QueryDocumentService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('queryDocument', () => {
    it('should call queryDocumentService.queryDocument and return the result', async () => {
      const mockInput: QueryDocumentInput = {
        templateName: 'test-template',
      };

      const expectedResponse: QueryDocumentResponse = {
        status: 'SUCCESS',
        message: 'Document queried successfully',
        data: {
          presignedUrl: 'https://example.com/document',
          b64encoded: 'base64EncodedString',
        },
      };

      queryDocumentService.queryDocument.mockResolvedValue(expectedResponse);

      const result = await resolver.queryDocument(mockInput);

      expect(queryDocumentService.queryDocument).toHaveBeenCalledWith(
        mockInput,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from queryDocumentService.queryDocument', async () => {
      const mockInput: QueryDocumentInput = {
        templateName: 'test-template',
      };

      const expectedError = new Error('Test error');

      queryDocumentService.queryDocument.mockRejectedValue(expectedError);

      await expect(resolver.queryDocument(mockInput)).rejects.toThrow(
        expectedError,
      );
    });
  });
});
