import { examples } from "@/db/schema";
import { PaginationResponse } from "@/utils/pagination";

export type Example = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;

export type PaginationExamples = PaginationResponse<Example>;
