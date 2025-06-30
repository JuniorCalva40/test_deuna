import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class ElectronicSignatureRequestDto {
  @ApiProperty({
    description: 'Identification number of the applicant',
    example: '1712345678',
  })
  @IsNotEmpty()
  @IsString()
  identificationNumber: string;

  @ApiProperty({
    description: 'Applicant name',
    example: 'Juan',
  })
  @IsNotEmpty()
  @IsString()
  applicantName: string;

  @ApiProperty({
    description: 'First last name of the applicant',
    example: 'Pérez',
  })
  @IsNotEmpty()
  @IsString()
  applicantLastName: string;

  @ApiProperty({
    description: 'Second last name of the applicant',
    example: 'López',
  })
  @IsOptional()
  @IsString()
  applicantSecondLastName?: string;

  @ApiProperty({
    description: 'Fingerprint code',
    example: '2',
  })
  @IsNotEmpty()
  @IsString()
  fingerCode: string;

  @ApiProperty({
    description: 'Email address of the applicant',
    example: 'juan.perez@ejemplo.com',
  })
  @IsNotEmpty()
  @IsEmail()
  emailAddress: string;

  @ApiProperty({
    description: 'Cellphone number',
    example: '+593987654321',
  })
  @IsNotEmpty()
  @IsString()
  cellphoneNumber: string;

  @ApiProperty({
    description: 'City of residence',
    example: 'Quito',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Province of residence',
    example: 'Pichincha',
  })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty({
    description: 'Complete address',
    example: 'Av. República de El Salvador N36-84 y Av. Naciones Unidas',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Front image of the identification document in base64 format',
    example: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBw...',
  })
  @IsNotEmpty()
  @IsString()
  fileIdentificationFront: string;

  @ApiProperty({
    description: 'Back image of the identification document in base64 format',
    example: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBw...',
  })
  @IsNotEmpty()
  @IsString()
  fileIdentificationBack: string;

  @ApiProperty({
    description: 'Selfie image of the applicant in base64 format',
    example: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBw...',
  })
  @IsNotEmpty()
  @IsString()
  fileIdentificationSelfie: string;
}
