import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class ElectronicSignatureUpdateDto {
  @ApiProperty({
    description: 'Applicant name',
    example: 'Juan',
    required: false,
  })
  @IsOptional()
  @IsString()
  applicantName?: string;

  @ApiProperty({
    description: 'First last name of the applicant',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  applicantLastName?: string;

  @ApiProperty({
    description: 'Fingerprint code',
    example: '2',
    required: false,
  })
  @IsOptional()
  @IsString()
  fingerCode?: string;

  @ApiProperty({
    description: 'Email address of the applicant',
    example: 'juan.perez@ejemplo.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  emailAddress?: string;

  @ApiProperty({
    description: 'Cellphone number',
    example: '+593987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  cellphoneNumber?: string;

  @ApiProperty({
    description: 'City of residence',
    example: 'Quito',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Province of residence',
    example: 'Pichincha',
    required: false,
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({
    description: 'Complete address',
    example: 'Av. República de El Salvador N36-84 y Av. Naciones Unidas',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Front image of the identification document in base64 format',
    example: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBw...',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileIdentificationFront?: string;

  @ApiProperty({
    description: 'Back image of the identification document in base64 format',
    example: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBw...',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileIdentificationBack?: string;

  @ApiProperty({
    description: 'Selfie image of the applicant in base64 format',
    example: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBw...',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileIdentificationSelfie?: string;
}
