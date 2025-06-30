import { Injectable, Inject } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import {
  CNB_SECUENCE_PORT,
  CnbSecuencePort,
} from '../../ports/out/clients/cnb-secuence.port';

@Injectable()
export class GetSecuenceUseCase {
  constructor(
    @Inject(CNB_SECUENCE_PORT)
    private readonly cnbSecuencePort: CnbSecuencePort,
    private readonly logger: Logger,
  ) {}

  async execute(): Promise<string> {
    try {
      this.logger.log(`init | GetSecuenceUseCase`);
      return await this.cnbSecuencePort.getSecuence();
    } catch (error) {
      this.logger.log(`finish | error | GetSecuenceUseCase ${error.message}`);
      throw new Error(`Error get secuence: ${error.message}`);
    }
  }
}
