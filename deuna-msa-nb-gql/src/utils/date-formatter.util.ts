/**
 * Formats the current date into a "Pago de comisión [Month Name] de [Current Year]" string.
 * @returns The formatted payout reason string for the current month and year.
 */
export const formatPayoutReasonFromMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
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
  const monthName = monthNames[now.getMonth()];
  return `Pago de comisión ${monthName} de ${year}`;
};
