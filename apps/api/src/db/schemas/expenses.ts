import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { receipts } from "./receipts";

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  receipt_id: uuid("receipt_id")
    .notNull()
    .references(() => receipts.id, { onDelete: "cascade" }),

  amount: integer("amount").notNull(),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").$onUpdateFn(() => new Date()),
});
