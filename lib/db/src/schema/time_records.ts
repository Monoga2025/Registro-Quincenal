import { pgTable, serial, integer, timestamp, text, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const timeRecordsTable = pgTable("time_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  checkInAt: timestamp("check_in_at").notNull().defaultNow(),
  checkOutAt: timestamp("check_out_at"),
  date: date("date").notNull(),
  hoursWorked: real("hours_worked"),
  notes: text("notes"),
});

export const insertTimeRecordSchema = createInsertSchema(timeRecordsTable).omit({ id: true });
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type TimeRecord = typeof timeRecordsTable.$inferSelect;
