import { Controller, Post, Body, Inject, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueryDocumentServicePort } from '../../../application/ports/in/services/query-document.service.port.interface';
import { QueryDocumentDto } from '../../../application/dto/query-document.dto';
/**
 * Controller for handling document generation requests.
 */
@ApiTags('documents')
@Controller('v1/documents')
export class QueryDocumentController {
  constructor(
    @Inject('QueryDocumentServicePort')
    private readonly queryDocumentService: QueryDocumentServicePort,
  ) {}

  /**
   * Endpoint for querying and generating a document.
   *
   * @param queryDocumentDto - The input data for generating the document.
   * @returns An object containing the status, message, and generated document data.
   */
  @Post('query')
  @ApiOperation({ summary: 'Query and generate a document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The document has been successfully generated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error occurred.',
  })
  async queryDocument(@Body() queryDocumentDto: QueryDocumentDto) {
    const result =
      await this.queryDocumentService.queryDocument(queryDocumentDto);
    return {
      status: 'success',
      message: 'Documento generado con éxito',
      data: result,
    };
  }
}
