/**
 * Formats an Ecuadorian address
 * @param {Object} input - Object with the fullAddress property
 * @returns {Object} - Object with province, city and address
 */
export function formatAddress(input: { fullAddress: string }) {
  // Verify that the fullAddress property exists
  if (!input || !input.fullAddress) {
    throw new Error('The input must contain the "fullAddress" property');
  }

  // Split the address using the "/" delimiter
  const parts = input.fullAddress.split('/').map((part) => part.trim());

  // Verify that there are enough parts
  if (parts.length < 3) {
    throw new Error('Invalid address format. Expected province/city/address');
  }

  // Extract components
  const province = parts[0];
  const city = parts[1];
  // The address is everything after province and city
  const address = parts.slice(2).join(' / ');

  return {
    province,
    city,
    address,
  };
}
