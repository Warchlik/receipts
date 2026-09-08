import {
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { receipt_members, receipts } from "./receipts";

export const receipt_invites = pgTable("receipt_invites", {
  id: uuid("id").defaultRandom().primaryKey(),

  receipt_id: uuid("receipt_id")
    .notNull()
    .references(() => receipts.id, { onDelete: "cascade" }),

  // Set = claim an existing guest member; null = join as a brand new member.
  member_id: uuid("member_id").references(
    () => receipt_members.id,
    {
      onDelete: "cascade",
    },
  ),

  token: text("token").notNull().unique(),
  created_by: text("created_by")
    .notNull()
    .references(() => user.id),

  expires_at: timestamp("expires_at").notNull(),
  used_at: timestamp("used_at"),
  created_at: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const receiptInvitesRelations = relations(
  receipt_invites,
  ({ one }) => ({
    receipt: one(receipts, {
      fields: [receipt_invites.receipt_id],
      references: [receipts.id],
    }),
    member: one(receipt_members, {
      fields: [receipt_invites.member_id],
      references: [receipt_members.id],
    }),
  }),
);
