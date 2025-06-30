import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
class CommissionDto {
  @Field(() => String)
  @ApiProperty({ description: 'ID de la transacción' })
  id: string;

  @Field(() => String)
  @ApiProperty({ description: 'Tipo de la transacción' })
  type: string;

  @Field(() => Float)
  @ApiProperty({ description: 'Monto de la comisión' })
  amount: number;

  @Field(() => String)
  @ApiProperty({ description: 'Fecha de la transacción' })
  transactionDate: string;

  @Field(() => String)
  @ApiProperty({ description: 'Estado de la comisión' })
  status: string;
}

@ObjectType()
export class SearchCommissionsResponseDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Total number of commissions found' })
  totalElements: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Total number of pages available' })
  totalPages: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Current page of results' })
  currentPage: number;

  @Field(() => [CommissionDto])
  @ApiProperty({
    type: () => [CommissionDto],
    description: 'List of commissions',
  })
  commissions: CommissionDto[];
}
