import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { user } from "./auth";

export const splitTypeEnum = pgEnum("split_type", [
  "equal",
  "manual",
  "itemized",
]);

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

  split_type: splitTypeEnum("split_type")
    .notNull()
    .default("manual"),

  created_at: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const receiptRoleEnum = pgEnum("receipt_role", [
  "creator",
  "member",
]);

export const receipt_members = pgTable(
  "receipt_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    receipt_id: uuid("receipt_id")
      .notNull()
      .references(() => receipts.id, {
        onDelete: "cascade",
      }),

    user_id: text("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    guest_name: text("guest_name"),

    role: receiptRoleEnum("role")
      .notNull()
      .default("member"),
    invited_by: text("invited_by")
      .notNull()
      .references(() => user.id),

    amount_owed: integer("amount_owed"),
    amount_owed_override: boolean("amount_owed_override")
      .notNull()
      .default(false),
    paid_at: timestamp("paid_at"),
    joined_at: timestamp("joined_at")
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "receipt_members_user_xor_guest",
      sql`(${table.user_id} IS NOT NULL AND ${table.guest_name} IS NULL) OR (${table.user_id} IS NULL AND ${table.guest_name} IS NOT NULL)`,
    ),
    uniqueIndex("receipt_members_receipt_user_unique")
      .on(table.receipt_id, table.user_id)
      .where(sql`${table.user_id} IS NOT NULL`),
    uniqueIndex("receipt_members_receipt_guest_unique")
      .on(table.receipt_id, sql`lower(${table.guest_name})`)
      .where(sql`${table.guest_name} IS NOT NULL`),
  ],
);

export const receiptsRelations = relations(
  receipts,
  ({ many }) => ({
    receipt_members: many(receipt_members),
  }),
);

export const receiptMembersRelations = relations(
  receipt_members,
  ({ one }) => ({
    receipt: one(receipts, {
      fields: [receipt_members.receipt_id],
      references: [receipts.id],
    }),
    user: one(user, {
      fields: [receipt_members.user_id],
      references: [user.id],
    }),
  }),
);
