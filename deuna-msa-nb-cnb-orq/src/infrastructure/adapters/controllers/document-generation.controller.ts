import { Controller, Post, Body, Inject, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GenerateDocumentDto } from '../../../application/dto/generate-document.dto';
import { DocumentGenerationServicePort } from '../../../application/ports/in/services/document-generation.service.port.interface';

@ApiTags('documents')
@Controller('v1/documents')
export class DocumentGenerationController {
  constructor(
    @Inject('DocumentGenerationPort')
    private readonly documentGenerationService: DocumentGenerationServicePort,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate and send a document' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The document has been successfully generated and sent.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error occurred.',
  })
  async generateDocument(@Body() generateDocumentDto: GenerateDocumentDto) {
    const result =
      await this.documentGenerationService.generateAndSendDocument(
        generateDocumentDto,
      );

    return {
      status: 'success',
      message: 'Documento generado y almacenado con éxito',
      data: [
        {
          ...result,
          fileName: generateDocumentDto.fileName,
          processName: generateDocumentDto.processName,
          tags: generateDocumentDto.tags,
        },
      ],
    };
  }
}
