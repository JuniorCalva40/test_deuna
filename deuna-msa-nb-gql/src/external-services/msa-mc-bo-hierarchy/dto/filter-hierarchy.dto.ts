export enum registerStatus {
  ACTIVE = 'A',
  INACTIVE = 'I',
  DELETED = 'D',
}

export class FilterHierarchyResponseDto {
  items: {
    id: number;
    clientId: string;
    nodeType: string;
    status: registerStatus;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    origin: string;
    children: [];
  }[];

  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };

  links: {
    first: string;
    previous: string;
    next: string;
    last: string;
  };
}
