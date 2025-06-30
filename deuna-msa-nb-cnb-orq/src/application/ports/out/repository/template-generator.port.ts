export const TEMPLATE_GENERATOR_PORT = 'TemplateGeneratorPort' as const;

export interface TemplateGeneratorPort {
  /**
   * Generates a template using the provided template name, template file path, and dynamic data.
   *
   * @param templateName - The name of the template to generate.
   * @param templatePath - The path to the template file.
   * @param dynamicData - An object containing dynamic data to be used in the template.
   * @returns A Promise that resolves with the generated template content as a string.
   */
  generateTemplate(templateName: string, templatePath: string): Promise<string>;
}
