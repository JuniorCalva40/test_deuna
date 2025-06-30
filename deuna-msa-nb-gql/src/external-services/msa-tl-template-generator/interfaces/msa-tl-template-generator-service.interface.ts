import { Observable } from 'rxjs';
import {
  TemplateGeneratorDto,
  TemplateGeneratorResponseDto,
} from '../dto/msa-tl-template-generator.dto';

export interface IMsaTlTemplateGeneratorService {
  generateTemplate(
    template: TemplateGeneratorDto,
    headers?: { trackingId?: string },
  ): Observable<TemplateGeneratorResponseDto>;
}
