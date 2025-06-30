import { ApiProperty } from '@nestjs/swagger';

export enum CnbState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PreApprovedState {
  TO_COMPLETE = 'TO_COMPLETE',
  REMAINING = 'REMAINING',
  CONTINUE = 'CONTINUE',
  APPROVED = 'APPROVED',
  INACTIVE = 'INACTIVE',
  REVIEW = 'REVIEW',
  BLOCKED_TMP = 'BLOCKED_TMP',
  BLOCKED_PERMANENT = 'BLOCKED_PERMANENT',
}

export class EstablishmentValidate {
  state: string;
  headquarters: string;
  fullAddress: string;
  establishmentType: string;
  numberEstablishment: string;
  commercialName: string;
}

export class CnbStateValidationDTO {
  @ApiProperty({
    description:
      'Numero de identificación, puede ser el número de cédula o el número de RUC.',
    example: '17070000000',
  })
  identification: string;

  @ApiProperty({
    description: 'Respuesta del estado del usuario en listas negras',
    example: true,
  })
  isBlacklisted?: boolean;

  @ApiProperty({
    description: 'Estado referncial al momento de obetener la data del redis',
    example: 'found o not_found',
  })
  status?: string;
}

export class CnbStateValidationResponseDTO {
  @ApiProperty({
    description:
      'Numero de identificación del establecimiento, puede ser el número de cédula o el número de RUC.',
    example: '17070000000',
  })
  identification: string;

  @ApiProperty({
    description: 'Estado referncial al momento de obetener la data del redis',
    example: 'found o not_found',
  })
  status?: string;
}
