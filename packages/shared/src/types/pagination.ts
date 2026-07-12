export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginationResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};
