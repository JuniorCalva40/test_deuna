import { IsString } from 'class-validator';

export class AuditFields {
  @IsString()
  executor: string;
  @IsString()
  approver: string;
}
