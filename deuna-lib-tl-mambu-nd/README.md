# Mambu module for NestJS

This module contains Mambu core services for each domain and Mambu Deuna core operations on each domain

## Usage

Mambu module is a dynamic module that configure authentication by Apikey or Basic Authentication

The example below shows an import.

Apikey Auth

```ts
import { MambuModule } from '@deuna/tl-mambu-nd';

@Module({
  MambuModule.register({
      context: 'Mambu accounts operation service',
      domain: process.env.MAMBU_API,
      apikey: process.env.MAMBU_APIKEY_OPERATIONS,
    }),
})
export class AppModule {}
```

Apikey Auth

```ts
import { MambuModule } from '@deuna/tl-mambu-nd';

@Module({
  MambuModule.register({
      context: 'Mambu accounts operation service',
      domain: process.env.MAMBU_API,
      user: process.env.MAMBU_USER,
      password: process.env.MAMBU_PASSWORD,
    }),
})
export class AppModule {}
```

## Services

### DeunaClientsService

Provides deuna mambu clients functions, enabled functions:

| **Function**                | **Description**                             |
| --------------------------- | ------------------------------------------- |
| findById                    | Find mambu user by id                       |
| searchByCenterOfCosts       | Search clients by center of costs           |
| searchByCenterOfCostsAsNull | Serach clients with center of costs in null |
| updateCenterOfCosts         | Update center of costs of client            |
| searchRecentClients         | Search recent clients by person type        |
| search                      | Search client by params                     |
| changeBranchCenter          | Change client branch center                 |

### DeunaClientContactService

Provides deuna mambu client contacts functions, enabled functions:

| **Function**  | **Description**            |
| ------------- | -------------------------- |
| updatePhone   | Update client phone number |
| updateEmail   | Update client email        |
| updateContact | Update client contact      |

### DeunaClientUpdateService

Provides deuna mambu client update functions, enabled functions:

| **Function** | **Description**                                              |
| ------------ | ------------------------------------------------------------ |
| updateName   | Update client first name and last name by client encoded key |

### DeunaDepositAccountsService

Provides deuna mambu deposits account functions, enabled functions:

| **Function**       | **Description**                                                                    |
| ------------------ | ---------------------------------------------------------------------------------- |
| fetchById          | Find deposit account by Id                                                         |
| changeState        | Represents the information to post an action, such as approving a deposit account. |
| applyInterest      | Apply interest                                                                     |
| changeInterestRate | Change deposit account interest rate                                               |
| update             | Partially update deposit account                                                   |

### DeunaGLAccountService

Provides deuna mambu general ledger accounts functions, enabled functions:

| **Function**       | **Description**                                 |
| ------------------ | ----------------------------------------------- |
| createJournarEntry | Create journal entries for accounting movements |

# Search

The search method is designed to provide a flexible way to query data with various filtering, sorting, and pagination options. The method accepts the following parameters:

- `filterCriteria`: Optional. Specifies the filtering criteria.
- `pagination`: Optional. Specifies the pagination settings.
- `detailsLevel`: Specifies the level of detail to be returned in the response. Defaults to `DetailsLevel.BASIC`.

The method returns a `Promise` that resolves to an object containing the following properties:

- `data`: The filtered and paginated data.
- `paginationDetails`: An object containing details about the pagination.

## Interfaces

### FilterCriteria

The `FilterCriteria` interface defines the criteria used to filter the data.

```typescript
export interface FilterCriteria {
  filterCriteria: Criteria[];
  sortingCriteria?: SortingCriteria;
}
```

### Criteria

The `Criteria` interface defines a single criterion for filtering.

```typescript
export interface Criteria {
  field: string;
  operator: CriteriaOperator;
  value?: string;
  values?: string[];
  secondValue?: string;
}
```

### SortingCriteria

The `SortingCriteria` interface defines the criteria used to sort the data.

```typescript
export interface SortingCriteria {
  field: string;
  order?: SortingOrder;
}
```

### Pagination

The `Pagination` class defines the pagination settings.

```typescript
export class Pagination {
  paginationDetails: EnablePaginationDetails;
  offset: number;
  limit: number;
}
```

### PaginationDetails

The `PaginationDetails` class provides details about the pagination in the response.

```typescript
export class PaginationDetails {
  itemsLimit: number | null;
  itemsOffset: number | null;
  itemsTotal: number | null;
}
```

## Enums

### CriteriaOperator

The `CriteriaOperator` enum defines the operators that can be used in filtering criteria.

```typescript
export enum CriteriaOperator {
  EQUALS = 'EQUALS',
  EQUALS_CASE_SENSITIVE = 'EQUALS_CASE_SENSITIVE',
  MORE_THAN = 'MORE_THAN',
  LESS_THAN = 'LESS_THAN',
  BETWEEN = 'BETWEEN',
  ON = 'ON',
  AFTER = 'AFTER',
  BEFORE = 'BEFORE',
  BEFORE_INCLUSIVE = 'BEFORE_INCLUSIVE',
  STARTS_WITH = 'STARTS_WITH',
  STARTS_WITH_CASE_SENSITIVE = 'STARTS_WITH_CASE_SENSITIVE',
  IN = 'IN',
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  LAST_DAYS = 'LAST_DAYS',
  EMPTY = 'EMPTY',
  NOT_EMPTY = 'NOT_EMPTY',
}
```

### EnablePaginationDetails

The `EnablePaginationDetails` enum defines whether pagination details should be included in the response headers.

```typescript
export enum EnablePaginationDetails {
  ON = 'ON',
  OFF = 'OFF',
}
```

## Response

The search method returns a `Promise` that resolves to an object with the following structure:

```typescript
{
  data: T; // The filtered and paginated data.
  paginationDetails: PaginationDetails; // Details about the pagination.
}
```

### PaginationDetails Properties

- `itemsLimit`: The maximum number of items that can be returned in a single page.
- `itemsOffset`: The index of the first item returned in the current page.
- `itemsTotal`: The total number of items available across all pages.

## Usage

To use the search method, you need to provide the necessary parameters. Here is a basic example:

```typescript
const searchParams = {
  filterCriteria: {
    filterCriteria: [
      {
        field: 'name',
        operator: CriteriaOperator.EQUALS_CASE_SENSITIVE,
        value: 'John Doe',
      },
    ],
    sortingCriteria: {
      field: 'createdAt',
      order: 'DESC',
    },
  },
  pagination: new Pagination({
    paginationDetails: EnablePaginationDetails.OFF,
    offset: 0,
    limit: 10,
  }),
  detailsLevel: DetailsLevel.BASIC,
};

const { data, paginationDetails } = await search(searchParams);
```

## Examples

### Example 1: Basic Search

```typescript
const searchParams = {
  filterCriteria: {
    filterCriteria: [
      {
        field: 'accountState',
        operator: CriteriaOperator.EQUALS_CASE_SENSITIVE,
        value: 'ACTIVE',
      },
    ],
  },
  detailsLevel: DetailsLevel.BASIC,
};

const { data, paginationDetails } = await search(searchParams);
```

### Example 2: Search with Pagination

```typescript
const searchParams = {
  filterCriteria: {
    filterCriteria: [
      {
        field: 'maxBalance',
        operator: CriteriaOperator.MORE_THAN,
        value: '30',
      },
    ],
  },
  pagination: new Pagination({
    paginationDetails: EnablePaginationDetails.ON,
    offset: 0,
    limit: 20,
  }),
  detailsLevel: DetailsLevel.BASIC,
};

const { data, paginationDetails } = await search(searchParams);
```

### Example 3: Search with Sorting

```typescript
const searchParams = {
  filterCriteria: {
    filterCriteria: [
      {
        field: 'balances.totalBalance',
        operator: CriteriaOperator.BETWEEN,
        value: '50000',
        secondValue: '100000',
      },
    ],
    sortingCriteria: {
      field: 'salary',
      order: 'ASC',
    },
  },
  detailsLevel: DetailsLevel.BASIC,
};

const { data, paginationDetails } = await search(searchParams);
```
