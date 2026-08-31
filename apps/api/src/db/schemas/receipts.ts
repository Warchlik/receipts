import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const receipts = pgTable("receipts", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: text("title").notNull(),
  description: text("description"),

  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("PLN"),
  people_count: integer("people_count").notNull(),
  category: text("category").default("other"),
  purchase_at: timestamp("purchase_at"),

  receipt_image_url: text("receipt_image_url"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const receiptRoleEnum = pgEnum("receipt_role", ["creator", "member"]);

export const user_receipts = pgTable(
  "user_receipts",
  {
    role: receiptRoleEnum("role").notNull().default("member"),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    receipt_id: uuid("receipt_id")
      .notNull()
      .references(() => receipts.id, { onDelete: "cascade" }),

    amount_owed: integer("amount_owed"),
    paid_at: timestamp("paid_at"),
    joined_at: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.receipt_id] })],
);

export const receiptsRelations = relations(receipts, ({ many }) => ({
  user_receipts: many(user_receipts),
}));

export const userReceiptsRelations = relations(user_receipts, ({ one }) => ({
  receipt: one(receipts, {
    fields: [user_receipts.receipt_id],
    references: [receipts.id],
  }),
  user: one(user, {
    fields: [user_receipts.user_id],
    references: [user.id],
  }),
}));
