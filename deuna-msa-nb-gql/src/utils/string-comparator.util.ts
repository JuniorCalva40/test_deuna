import { difference } from 'lodash';

const referenceData = [
  'start-onb-cnb',
  'confirm-data',
  'accept-billing',
  'accept-contract',
  'sign-contract',
];

export function findMissingStrings(inputArray: string[]): string[] {
  return difference(referenceData, inputArray);
}
