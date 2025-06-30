import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateDocumentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  commerceId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  htmlTemplate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  identification: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  processName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  extension: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  tags: string[];
}

export class GenerateDocumentRespDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signedUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  base64: string;
}
