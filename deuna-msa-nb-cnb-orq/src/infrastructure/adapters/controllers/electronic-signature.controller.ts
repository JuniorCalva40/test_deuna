import {
  Controller,
  Inject,
  Post,
  Patch,
  Get,
  Body,
  Headers,
  Param,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { Logger } from '@deuna/tl-logger-nd';
import { ElectronicSignatureRequestDto } from '@src/application/dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureResponseDto } from '@src/application/dto/electronic-signature/electronic-signature-redis-response.dto';
import { ElectronicSignatureUpdateDto } from '@src/application/dto/electronic-signature/electronic-signature-update.dto';
import { ElectronicSignatureUpdateResponseDto } from '@src/application/dto/electronic-signature/electronic-signature-update-redis-response.dto';
import { ElectronicSignatureGetResponseDto } from '@src/application/dto/electronic-signature/electronic-signature-get-response.dto';
import { ElectronicSignatureProcessResponseDto } from '@src/application/dto/electronic-signature/electronic-signature-process-response.dto';
import {
  ElectronicSignatureServicePort,
  ELECTRONIC_SIGNATURE_PORT,
} from '../../../application/ports/in/services/electronic-signature.service.port';
import { validateTrackingHeadersApi } from '@src/domain/utils/validator-tracking-headers-api';

@ApiTags('Electronic Signature')
@Controller('v1/electronic-signature')
export class ElectronicSignatureController {
  constructor(
    @Inject(ELECTRONIC_SIGNATURE_PORT)
    private readonly electronicSignatureService: ElectronicSignatureServicePort,
    private readonly logger: Logger,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar solicitud de firma electrónica' })
  @ApiResponse({ type: ElectronicSignatureResponseDto })
  @ApiHeader({ name: 'sessionId', required: true })
  @ApiHeader({ name: 'trackingId', required: true })
  @ApiHeader({ name: 'requestId', required: true })
  async registerSignatureRequest(
    @Body() request: ElectronicSignatureRequestDto,
    @Headers('sessionId') sessionId: string,
    @Headers('trackingId') trackingId: string,
    @Headers('requestId') requestId: string,
  ): Promise<ElectronicSignatureResponseDto> {
    validateTrackingHeadersApi(
      this.logger,
      'Starting Electronic Signature Request - Controller',
      sessionId,
      trackingId,
      requestId,
    );

    return await this.electronicSignatureService.saveSignatureRequest(
      request,
      sessionId,
      trackingId,
      requestId,
    );
  }

  @Patch(':identificationNumber')
  @ApiOperation({ summary: 'Actualizar solicitud de firma electrónica' })
  @ApiResponse({ type: ElectronicSignatureUpdateResponseDto })
  @ApiParam({
    name: 'identificationNumber',
    description: 'Número de identificación del solicitante',
    example: '0987654321',
  })
  @ApiHeader({ name: 'sessionId', required: true })
  @ApiHeader({ name: 'trackingId', required: true })
  @ApiHeader({ name: 'requestId', required: true })
  async updateSignatureRequest(
    @Param('identificationNumber') identificationNumber: string,
    @Body() updateData: ElectronicSignatureUpdateDto,
    @Headers('sessionId') sessionId: string,
    @Headers('trackingId') trackingId: string,
    @Headers('requestId') requestId: string,
  ): Promise<ElectronicSignatureUpdateResponseDto> {
    validateTrackingHeadersApi(
      this.logger,
      'Starting Electronic Signature Update - Controller',
      sessionId,
      trackingId,
      requestId,
    );

    return await this.electronicSignatureService.updateSignatureRequest(
      identificationNumber,
      updateData,
      sessionId,
      trackingId,
      requestId,
    );
  }

  @Get(':identificationNumber')
  @ApiOperation({ summary: 'Obtener solicitud de firma electrónica' })
  @ApiResponse({ type: ElectronicSignatureGetResponseDto })
  @ApiParam({
    name: 'identificationNumber',
    description: 'Número de identificación del solicitante',
    example: '0987654321',
  })
  @ApiHeader({ name: 'sessionId', required: true })
  @ApiHeader({ name: 'trackingId', required: true })
  @ApiHeader({ name: 'requestId', required: true })
  async getSignatureRequest(
    @Param('identificationNumber') identificationNumber: string,
    @Headers('sessionId') sessionId: string,
    @Headers('trackingId') trackingId: string,
    @Headers('requestId') requestId: string,
  ): Promise<ElectronicSignatureGetResponseDto> {
    validateTrackingHeadersApi(
      this.logger,
      'Starting Electronic Signature Get Request - Controller',
      sessionId,
      trackingId,
      requestId,
    );

    return await this.electronicSignatureService.getSignatureRequest(
      identificationNumber,
      sessionId,
      trackingId,
      requestId,
    );
  }

  @Post(':identificationNumber/process')
  @ApiOperation({ summary: 'Procesar solicitud de firma electrónica' })
  @ApiResponse({ type: ElectronicSignatureProcessResponseDto })
  @ApiParam({
    name: 'identificationNumber',
    description: 'Número de identificación del solicitante',
    example: '0987654321',
  })
  @ApiHeader({ name: 'sessionId', required: true })
  @ApiHeader({ name: 'trackingId', required: true })
  @ApiHeader({ name: 'requestId', required: true })
  async processSignatureRequest(
    @Param('identificationNumber') identificationNumber: string,
    @Headers('sessionId') sessionId: string,
    @Headers('trackingId') trackingId: string,
    @Headers('requestId') requestId: string,
  ): Promise<ElectronicSignatureProcessResponseDto> {
    validateTrackingHeadersApi(
      this.logger,
      'Iniciando Procesamiento de Firma Digital - Controlador',
      sessionId,
      trackingId,
      requestId,
    );

    return await this.electronicSignatureService.processDigitalSignature(
      identificationNumber,
      sessionId,
      trackingId,
      requestId,
    );
  }
}
