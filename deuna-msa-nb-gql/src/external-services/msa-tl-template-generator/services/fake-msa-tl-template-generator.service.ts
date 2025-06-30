import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { IMsaTlTemplateGeneratorService } from '../interfaces/msa-tl-template-generator-service.interface';
import {
  TemplateGeneratorDto,
  TemplateGeneratorResponseDto,
} from '../dto/msa-tl-template-generator.dto';

@Injectable()
export class FakeMsaTlTemplateGeneratorService
  implements IMsaTlTemplateGeneratorService
{
  generateTemplate(
    template: TemplateGeneratorDto,
  ): Observable<TemplateGeneratorResponseDto> {
    const fakeHtml = `<html><body><h1>Hello ${template.dynamicData.userName}</h1><p>Your OTP is: ${template.dynamicData.OTP}</p></body></html>`;
    return of({ generatedHtml: [fakeHtml] });
  }
}
