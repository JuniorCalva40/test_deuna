import { Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import 'reflect-metadata';
import { FieldWithApiProperty } from './FieldWithApiProperty';

// Mock the @nestjs/graphql module.
// The return value of Field() is the actual decorator, which we also mock.
jest.mock('@nestjs/graphql', () => ({
  Field: jest.fn(() => jest.fn()),
}));

const MockedField = Field as jest.Mock;

describe('FieldWithApiProperty', () => {
  beforeEach(() => {
    // Clears the history of calls to the mock.
    MockedField.mockClear();
  });

  it('should call Field with the correct type function and no options when ApiProperty is not present', () => {
    const typeFunc = () => String;

    // Decorators are applied at definition time.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class TestDto {
      @FieldWithApiProperty(typeFunc)
      property: string;
    }

    // Check that Field factory was called correctly
    expect(MockedField).toHaveBeenCalledTimes(1);
    // The current implementation will never pass options.
    expect(MockedField).toHaveBeenCalledWith(typeFunc);
  });

  // This test confirms the current implementation does not correctly read the ApiProperty description.
  it('should call Field with only the type function, even when ApiProperty has a description', () => {
    const typeFunc = () => String;
    const description = 'Test Description';

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class TestWithApiDto {
      @ApiProperty({ description })
      @FieldWithApiProperty(typeFunc)
      property: string;
    }

    // Check that Field factory was called correctly
    expect(MockedField).toHaveBeenCalledTimes(1);
    // It is expected to be called without the description due to the implementation flaw.
    expect(MockedField).toHaveBeenCalledWith(typeFunc);
    // We explicitly check that it was NOT called with the description.
    expect(MockedField).not.toHaveBeenCalledWith(typeFunc, { description });
  });

  it('should call the returned decorator with the correct target and propertyKey', () => {
    const typeFunc = () => String;
    
    // The mock for Field returns another mock for the decorator function itself.
    // We need to define a class for the decorator to be called.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class TestDecoratorCallDto {
      @FieldWithApiProperty(typeFunc)
      property: string;
    }

    const decoratorMock = MockedField.mock.results[0].value;

    expect(decoratorMock).toHaveBeenCalledTimes(1);
    expect(decoratorMock).toHaveBeenCalledWith(
      TestDecoratorCallDto.prototype,
      'property',
    );
  });
});
