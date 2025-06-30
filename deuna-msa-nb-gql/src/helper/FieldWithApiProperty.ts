import { Field } from '@nestjs/graphql';

export function FieldWithApiProperty(typeFunc: () => any) {
  return function (target: any, propertyKey: string) {
    // Fetch metadata for @ApiProperty
    const apiPropertyMetadata =
      Reflect.getMetadata(
        'swagger/apiModelProperties',
        target.constructor, // For class-level metadata
      ) ??
      Reflect.getMetadata('swagger/apiModelProperties', target, propertyKey);

    // Apply GraphQL field with description if available
    if (apiPropertyMetadata?.description) {
      Field(typeFunc, { description: apiPropertyMetadata.description })(
        target,
        propertyKey,
      );
    } else {
      Field(typeFunc)(target, propertyKey);
    }
  };
}
