// INFO: Placecholder user file for implementation

import {
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const examples = pgTable("examples", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default(""),
  description: text("description"),
  created_at: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
