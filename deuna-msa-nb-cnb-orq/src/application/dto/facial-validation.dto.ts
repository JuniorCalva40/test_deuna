import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for facial validation
 * Contains the information necessary to perform a facial validation
 */
export class FacialValidationDto {
  @ApiProperty({
    description: 'Imagen del documento en formato base64',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
  })
  @IsNotEmpty()
  documentImage: string;

  @ApiProperty({
    description: 'Imagen del selfie en formato base64',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
  })
  @IsNotEmpty()
  selfieImage: string;

  @ApiProperty({
    description: 'Tipo de documento (DNI, pasaporte, etc.)',
    example: 'DNI',
  })
  @IsNotEmpty()
  @IsString()
  documentType: string;
}
