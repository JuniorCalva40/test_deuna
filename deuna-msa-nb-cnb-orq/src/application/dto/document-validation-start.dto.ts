import { ApiProperty } from '@nestjs/swagger';
import { DocumentValidationType } from '../../domain/enums/document-validation-type.enum';
import { IsNotEmpty, IsString } from 'class-validator';
// Base DTO with common properties
export class BaseDocumentValidationDto {
  trackingId: string;
  sessionId: string;
  requestId: string;
}

// specific DTO for start validation
export class DocumentValidationStartDto extends BaseDocumentValidationDto {
  @ApiProperty({
    description: 'Identificador único de la sesión de onboarding',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  @IsNotEmpty()
  @IsString()
  onboardingSessionId: string;

  @ApiProperty({
    description: 'Identificador único que sera enviado al servicio',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  @IsNotEmpty()
  @IsString()
  merchantIdScanReference: string;

  @ApiProperty({
    description: 'Imagen frontal del documento en base64',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  @IsNotEmpty()
  @IsString()
  frontsideImage: string;

  @ApiProperty({
    description: 'Imagen posterior del documento en base64',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  @IsNotEmpty()
  @IsString()
  backsideImage: string;

  @ApiProperty({
    description: 'País del documento',
    example: 'ECU',
  })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Tipo de documento',
    example: 'ID_CARD',
  })
  @IsNotEmpty()
  @IsString()
  idType: DocumentValidationType;
}
