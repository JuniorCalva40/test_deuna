export class TemplateGeneratorDto {
  templateName: string;
  templatePath: string;
  dynamicData: Record<string, any>;
}

export class TemplateGeneratorResponseDto {
  generatedHtml: string[];
}
