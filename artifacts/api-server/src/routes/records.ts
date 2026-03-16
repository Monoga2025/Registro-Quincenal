import { Router, type IRouter } from "express";
import { db, timeRecordsTable, hourlyRateSettingsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

async function getHourlyRate(): Promise<number> {
  const [rateSetting] = await db
    .select()
    .from(hourlyRateSettingsTable)
    .orderBy(sql`${hourlyRateSettingsTable.updatedAt} DESC`)
    .limit(1);
  return rateSetting?.rate ?? 10;
}

function formatRecord(record: typeof timeRecordsTable.$inferSelect) {
  return {
    ...record,
    checkInAt: record.checkInAt.toISOString(),
    checkOutAt: record.checkOutAt?.toISOString() ?? null,
  };
}

router.post("/checkin", requireAuth, async (req: AuthenticatedRequest, res) => {
  const today = getTodayDate();
  const employeeId = req.user!.id;

  // Check if already checked in today (and not checked out)
  const [existingOpen] = await db
    .select()
    .from(timeRecordsTable)
    .where(
      and(
        eq(timeRecordsTable.employeeId, employeeId),
        eq(timeRecordsTable.date, today),
        sql`${timeRecordsTable.checkOutAt} IS NULL`
      )
    );

  if (existingOpen) {
    // Check out the existing open record
    const hoursWorked =
      (Date.now() - existingOpen.checkInAt.getTime()) / (1000 * 60 * 60);

    const [updated] = await db
      .update(timeRecordsTable)
      .set({
        checkOutAt: new Date(),
        hoursWorked: Math.round(hoursWorked * 100) / 100,
      })
      .where(eq(timeRecordsTable.id, existingOpen.id))
      .returning();

    return res.status(201).json(formatRecord(updated));
  }

  // Create new check-in
  const [record] = await db
    .insert(timeRecordsTable)
    .values({
      employeeId,
      date: today,
      checkInAt: new Date(),
    })
    .returning();

  return res.status(201).json(formatRecord(record));
});

router.get("/today", requireAuth, async (req: AuthenticatedRequest, res) => {
  const today = getTodayDate();
  const employeeId = req.user!.id;

  const records = await db
    .select()
    .from(timeRecordsTable)
    .where(
      and(
        eq(timeRecordsTable.employeeId, employeeId),
        eq(timeRecordsTable.date, today)
      )
    )
    .orderBy(timeRecordsTable.checkInAt);

  return res.json(records.map(formatRecord));
});

router.get("/history", requireAuth, async (req: AuthenticatedRequest, res) => {
  const employeeId = req.user!.id;
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  const conditions = [eq(timeRecordsTable.employeeId, employeeId)];
  if (startDate) conditions.push(gte(timeRecordsTable.date, startDate));
  if (endDate) conditions.push(lte(timeRecordsTable.date, endDate));

  const records = await db
    .select()
    .from(timeRecordsTable)
    .where(and(...conditions))
    .orderBy(sql`${timeRecordsTable.date} DESC, ${timeRecordsTable.checkInAt} ASC`);

  const hourlyRate = await getHourlyRate();

  // Group by date
  const grouped = new Map<string, typeof records>();
  for (const record of records) {
    const date = record.date;
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(record);
  }

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const dailyRecords = Array.from(grouped.entries()).map(([date, dayRecords]) => {
    const totalHours = dayRecords.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
    const d = new Date(date + "T12:00:00");
    return {
      date,
      dayOfWeek: dayNames[d.getDay()],
      records: dayRecords.map(formatRecord),
      totalHours: Math.round(totalHours * 100) / 100,
      earnings: Math.round(totalHours * hourlyRate * 100) / 100,
    };
  });

  return res.json(dailyRecords);
});

router.get("/employee/:employeeId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const employeeId = parseInt(req.params.employeeId);

  // Employees can only view their own records
  if (req.user?.role !== "admin" && req.user?.id !== employeeId) {
    return res.status(403).json({ error: "forbidden", message: "Access denied" });
  }

  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  const conditions = [eq(timeRecordsTable.employeeId, employeeId)];
  if (startDate) conditions.push(gte(timeRecordsTable.date, startDate));
  if (endDate) conditions.push(lte(timeRecordsTable.date, endDate));

  const records = await db
    .select()
    .from(timeRecordsTable)
    .where(and(...conditions))
    .orderBy(sql`${timeRecordsTable.date} DESC`);

  const hourlyRate = await getHourlyRate();

  const grouped = new Map<string, typeof records>();
  for (const record of records) {
    if (!grouped.has(record.date)) grouped.set(record.date, []);
    grouped.get(record.date)!.push(record);
  }

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const dailyRecords = Array.from(grouped.entries()).map(([date, dayRecords]) => {
    const totalHours = dayRecords.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
    const d = new Date(date + "T12:00:00");
    return {
      date,
      dayOfWeek: dayNames[d.getDay()],
      records: dayRecords.map(formatRecord),
      totalHours: Math.round(totalHours * 100) / 100,
      earnings: Math.round(totalHours * hourlyRate * 100) / 100,
    };
  });

  return res.json(dailyRecords);
});

export default router;
