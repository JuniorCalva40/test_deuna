import { formatPayoutReasonFromMonth } from './date-formatter.util';

describe('formatPayoutReasonFromMonth', () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

    it('should format the current month and year correctly', () => {
    const expectedMonth = monthNames[currentMonth];
    const expectedResult = `Pago de comisión ${expectedMonth} de ${currentYear}`;

    expect(formatPayoutReasonFromMonth()).toBe(expectedResult);
  });

  it('should always return a string with the current date', () => {
    const result = formatPayoutReasonFromMonth();

    expect(result).toContain('Pago de comisión');
    expect(result).toContain(currentYear.toString());
    expect(result).toContain(monthNames[currentMonth]);
  });

  it('should return consistent results when called multiple times', () => {
    const result1 = formatPayoutReasonFromMonth();
    const result2 = formatPayoutReasonFromMonth();

    expect(result1).toBe(result2);
  });
});
