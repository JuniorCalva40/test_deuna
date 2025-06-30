import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TemplateGeneratorPort } from '../../../application/ports/out/repository/template-generator.port';
import { v4 as uuidv4 } from 'uuid';
import { TemplateGenerationError } from '../../../application/errors/template-generation-error';

/**
 * Adapter for generating templates using an external template generator service.
 */
@Injectable()
export class TemplateGeneratorAdapter implements TemplateGeneratorPort {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Generates a template using the provided template name, template file path, and dynamic data.
   *
   * @param templateName - The name of the template to generate.
   * @param templatePath - The path to the template file.
   * @param dynamicData - An object containing dynamic data to be used in the template.
   * @returns A Promise that resolves with the generated template content as a base64-encoded string.
   * @throws An Error if there is an issue generating the template.
   */
  async generateTemplate(
    templateName: string,
    templatePath: string,
  ): Promise<string> {
    const templateGeneratorUrl = this.configService.get(
      'TEMPLATE_GENERATOR_URL',
    );

    try {
      const response = await this.httpService
        .post(
          templateGeneratorUrl,
          {
            templateArray: [
              {
                templateName,
                templatePath,
                dynamicData: {},
              },
            ],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              trackingid: uuidv4(),
            },
          },
        )
        .toPromise();
      return response.data[0];
    } catch (error) {
      throw new TemplateGenerationError(error.message);
    }
  }
}
