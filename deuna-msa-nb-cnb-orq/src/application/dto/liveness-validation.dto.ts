import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

/**
 * DTO for liveness validation (life test)
 * Contains the information necessary to perform a liveness validation
 */
export class LivenessValidationDto {
  @ApiProperty({
    description: 'Imagen del selfie en formato base64',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
  })
  @IsNotEmpty()
  selfieImage: string;

  @ApiProperty({
    description:
      'Video o secuencia de imágenes para validación liveness en formato base64',
    example: 'data:video/mp4;base64,/9j/4AAQSkZJRgABA...',
  })
  @IsNotEmpty()
  livenessData: string;
}
