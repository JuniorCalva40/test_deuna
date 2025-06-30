import { formatAddress } from './format-address.util';

describe('formatAddress', () => {
  it('should format an address correctly with province, city and address', () => {
    const input = {
      fullAddress: 'Pichincha / Quito / Av. 6 de Diciembre y Naciones Unidas',
    };
    const result = formatAddress(input);

    expect(result).toEqual({
      province: 'Pichincha',
      city: 'Quito',
      address: 'Av. 6 de Diciembre y Naciones Unidas',
    });
  });

  it('should handle multiple "/" in the address part', () => {
    const input = {
      fullAddress:
        'Guayas / Guayaquil / Av. 9 de Octubre / Edificio Plaza / Piso 5',
    };
    const result = formatAddress(input);

    expect(result).toEqual({
      province: 'Guayas',
      city: 'Guayaquil',
      address: 'Av. 9 de Octubre / Edificio Plaza / Piso 5',
    });
  });

  it('should handle addresses with extra spaces', () => {
    const input = { fullAddress: ' Azuay  /  Cuenca  /  Calle Larga #20  ' };
    const result = formatAddress(input);

    expect(result).toEqual({
      province: 'Azuay',
      city: 'Cuenca',
      address: 'Calle Larga #20',
    });
  });

  it('should throw an error when no input is provided', () => {
    expect(() => formatAddress(null)).toThrow(
      'The input must contain the "fullAddress" property',
    );
  });

  it('should throw an error when fullAddress is missing', () => {
    expect(() => formatAddress({} as any)).toThrow(
      'The input must contain the "fullAddress" property',
    );
  });

  it('should throw an error when address format is invalid', () => {
    expect(() => formatAddress({ fullAddress: 'Pichincha' })).toThrow(
      'Invalid address format. Expected province/city/address',
    );
  });

  it('should throw an error when address format is incomplete', () => {
    expect(() => formatAddress({ fullAddress: 'Pichincha / Quito' })).toThrow(
      'Invalid address format. Expected province/city/address',
    );
  });
});
