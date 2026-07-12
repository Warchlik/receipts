import type { PaginationResponse } from "./pagination";

export type Example = {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ExampleList = PaginationResponse<Example>;
