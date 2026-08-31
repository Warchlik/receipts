import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const profiles = pgTable("profiles", {
  id: text("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),

  first_name: text("first_name"),
  last_name: text("last_name"),
  phone: text("phone"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(user, {
    fields: [profiles.id],
    references: [user.id],
  }),
}));
