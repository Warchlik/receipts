import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { receipt_members, receipts } from "./receipts";

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  receipt_id: uuid("receipt_id")
    .notNull()
    .references(() => receipts.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  amount: integer("amount").notNull(),

  created_at: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at").$onUpdateFn(
    () => new Date(),
  ),
});

// Which receipt_members an expense (item) is split across — the item's
// amount is divided equally between however many members are assigned here.
export const expense_splits = pgTable(
  "expense_splits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expense_id: uuid("expense_id")
      .notNull()
      .references(() => expenses.id, {
        onDelete: "cascade",
      }),
    member_id: uuid("member_id")
      .notNull()
      .references(() => receipt_members.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    uniqueIndex("expense_splits_expense_member_unique").on(
      table.expense_id,
      table.member_id,
    ),
  ],
);

export const expensesRelations = relations(
  expenses,
  ({ many }) => ({
    splits: many(expense_splits),
  }),
);

export const expenseSplitsRelations = relations(
  expense_splits,
  ({ one }) => ({
    expense: one(expenses, {
      fields: [expense_splits.expense_id],
      references: [expenses.id],
    }),
    member: one(receipt_members, {
      fields: [expense_splits.member_id],
      references: [receipt_members.id],
    }),
  }),
);
