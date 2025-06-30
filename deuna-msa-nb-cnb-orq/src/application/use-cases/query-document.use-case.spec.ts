import {
  QueryDocumentUseCase,
  QueryDocumentResult,
} from './query-document.use-case';
import { TemplateGeneratorPort } from '../ports/out/repository/template-generator.port';
import { FileGeneratorPort } from '../ports/out/repository/file-generator.port.interface';
import { QueryDocumentDto } from '../dto/query-document.dto';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

describe('QueryDocumentUseCase', () => {
  let useCase: QueryDocumentUseCase;
  let mockTemplateGeneratorPort: jest.Mocked<TemplateGeneratorPort>;
  let mockFileGeneratorPort: jest.Mocked<FileGeneratorPort>;

  beforeEach(() => {
    mockTemplateGeneratorPort = {
      generateTemplate: jest.fn(),
    };
    mockFileGeneratorPort = {
      generateFile: jest.fn(),
    };
    useCase = new QueryDocumentUseCase(
      mockTemplateGeneratorPort,
      mockFileGeneratorPort,
    );

    // Reset mock date
    jest.spyOn(Date, 'now').mockImplementation(() => 1234567890);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate a document successfully', async () => {
    const dto: QueryDocumentDto = {
      templateName: 'test-template',
      templatePath: '/path/to/template',
    };

    const mockHtmlTemplate = '<html>Test Template</html>';
    const mockGeneratedFile = {
      b64encoded: 'base64encodedstring',
      presignedUrl: 'http://example.com/file',
      message: 'File generated successfully',
    };

    mockTemplateGeneratorPort.generateTemplate.mockResolvedValue(
      mockHtmlTemplate,
    );
    mockFileGeneratorPort.generateFile.mockResolvedValue(mockGeneratedFile);

    const result: QueryDocumentResult = await useCase.execute(dto);

    expect(result).toEqual({
      b64encoded: 'base64encodedstring',
      presignedUrl: 'http://example.com/file',
    });

    expect(mockTemplateGeneratorPort.generateTemplate).toHaveBeenCalledWith(
      'test-template',
      '/path/to/template',
    );

    expect(mockFileGeneratorPort.generateFile).toHaveBeenCalledWith(
      mockHtmlTemplate,
      'test-template_1234567890.pdf',
      'mocked-uuid',
      'application/pdf',
      'pdf',
      'query-document',
      {
        templateName: 'test-template',
      },
    );
  });

  it('should throw an error if template generation fails', async () => {
    const dto: QueryDocumentDto = {
      templateName: 'test-template',
      templatePath: '/path/to/template',
    };

    mockTemplateGeneratorPort.generateTemplate.mockRejectedValue(
      new Error('Template generation failed'),
    );

    await expect(useCase.execute(dto)).rejects.toThrow(
      'Template generation failed',
    );
  });

  it('should throw an error if file generation fails', async () => {
    const dto: QueryDocumentDto = {
      templateName: 'test-template',
      templatePath: '/path/to/template',
    };

    mockTemplateGeneratorPort.generateTemplate.mockResolvedValue(
      '<html>Test Template</html>',
    );
    mockFileGeneratorPort.generateFile.mockRejectedValue(
      new Error('File generation failed'),
    );

    await expect(useCase.execute(dto)).rejects.toThrow(
      'File generation failed',
    );
  });
});
