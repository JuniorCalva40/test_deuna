import 'reflect-metadata';

export const PARSE_AMOUNT_METADATA = 'custom:parse-amount';

export interface ParseAmountOptions {
  min?: number;
}

export function ParseAmount(options: ParseAmountOptions = {}) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(PARSE_AMOUNT_METADATA, options, target, propertyKey);
  };
}