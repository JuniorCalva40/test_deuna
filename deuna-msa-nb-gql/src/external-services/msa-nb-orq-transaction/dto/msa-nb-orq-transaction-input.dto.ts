import { InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class InitiateDepositInput {
  @ApiProperty({ description: 'QR ID' })
  @IsNotEmpty()
  @IsString()
  QRid: string;
}
