import { pgTable, serial, real, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const hourlyRateSettingsTable = pgTable("hourly_rate_settings", {
  id: serial("id").primaryKey(),
  rate: real("rate").notNull().default(10),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => usersTable.id),
});

export const insertHourlyRateSchema = createInsertSchema(hourlyRateSettingsTable).omit({ id: true });
export type InsertHourlyRate = z.infer<typeof insertHourlyRateSchema>;
export type HourlyRateSetting = typeof hourlyRateSettingsTable.$inferSelect;
