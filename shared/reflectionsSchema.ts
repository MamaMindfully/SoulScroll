import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reflections = pgTable("reflections", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
});

export const insertReflectionSchema = createInsertSchema(reflections).omit({
  id: true,
  sharedAt: true,
});

export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type Reflection = typeof reflections.$inferSelect;