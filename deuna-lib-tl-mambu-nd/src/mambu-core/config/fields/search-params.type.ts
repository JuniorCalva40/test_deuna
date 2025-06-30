import { CriteriaOperator } from '../../mambu.types';

export enum DetailsLevel {
  BASIC = 'BASIC',
  FULL = 'FULL',
}

export enum EnablePaginationDetails {
  ON = 'ON',
  OFF = 'OFF',
}

export enum SortingOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface FilterCriteria {
  filterCriteria: Criteria[];
  sortingCriteria?: SortingCriteria;
}

/**
 * Represents the filter list used for searching deposit accounts.
 * @see {@link https://api.mambu.com/#tocsdepositaccountfiltercriteria} for details.
 */
export interface Criteria {
  field: string;
  operator: CriteriaOperator;
  value?: string;
  values?: string[];
  secondValue?: string;
}

/**
 * @class Pagination
 */
export class Pagination {
  /**
   * @property {EnablePaginationDetails} paginationDetails
   * @description Flag specifying whether the pagination details should be provided in response headers. Please note that by default it is disabled (OFF), in order to improve the performance of the APIs
   * @default "OFF"
   */
  paginationDetails: EnablePaginationDetails;
  offset: number;
  limit: number;
}

/**
 * @class PaginationDetails
 * @description Represents details about pagination for a set of items.  This includes information about the current page size, the starting offset, and the total number of items available.
 */
export class PaginationDetails {
  /**
   * @property {number} itemsLimit
   * @description The maximum number of items that can be returned in a single page.  This represents the requested page size.
   * @example 20
   */
  itemsLimit: number | null;

  /**
   * @property {number} itemsOffset
   * @description The index of the first item returned in the current page.  This is a zero-based index, meaning the first item has an offset of 0.
   * @example 0 (for the first page), 20 (for the second page if itemsLimit is 20)
   */
  itemsOffset: number | null;

  /**
   * @property {number} itemsTotal
   * @description The total number of items available across all pages.  This allows the client to calculate the total number of pages and navigate to any page.
   * @example 100
   */
  itemsTotal: number | null;
}

/**
 * The sorting criteria used for searching deposit accounts.
 * @see {@link https://api.mambu.com/#tocsdepositaccountsortingcriteria} for details.
 */
export interface SortingCriteria {
  /**
   * The field to use to sort the selection.
   * This can be an enumerated value or a custom field using the format `[customFieldSetId].[customFieldId]`.
   * @example "maxBalance" or "balances.availableBalance"
   */
  field: string;

  /**
   * The sorting order: `ASC` for ascending or `DESC` for descending.
   * @default "DESC"
   * @example "ASC"
   */
  order?: SortingOrder;
}
