import { Router, type IRouter } from "express";
import { db, usersTable, timeRecordsTable, hourlyRateSettingsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

async function getHourlyRate(): Promise<number> {
  const [rateSetting] = await db
    .select()
    .from(hourlyRateSettingsTable)
    .orderBy(sql`${hourlyRateSettingsTable.updatedAt} DESC`)
    .limit(1);
  return rateSetting?.rate ?? 10;
}

function getBiweeklyDates(period?: string): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let firstHalf = now.getDate() <= 15;

  if (period) {
    // Accept YYYY-MM-P1 or YYYY-MM-P2 format, or YYYY-MM (defaults to current half)
    const match = period.match(/^(\d{4})-(\d{2})(?:-(P[12]))?$/);
    if (match) {
      year = parseInt(match[1]);
      month = parseInt(match[2]) - 1;
      firstHalf = match[3] !== "P2";
    }
  }

  const monthPad = String(month + 1).padStart(2, "0");
  if (firstHalf) {
    return {
      startDate: `${year}-${monthPad}-01`,
      endDate: `${year}-${monthPad}-15`,
      label: `${year}-${monthPad}-P1`,
    };
  } else {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      startDate: `${year}-${monthPad}-16`,
      endDate: `${year}-${monthPad}-${lastDay}`,
      label: `${year}-${monthPad}-P2`,
    };
  }
}

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function formatRecord(record: typeof timeRecordsTable.$inferSelect) {
  return {
    ...record,
    checkInAt: record.checkInAt.toISOString(),
    checkOutAt: record.checkOutAt?.toISOString() ?? null,
  };
}

router.get("/biweekly", requireAdmin, async (req, res) => {
  const { period } = req.query as { period?: string };
  const { startDate, endDate, label } = getBiweeklyDates(period);

  const hourlyRate = await getHourlyRate();
  const employees = await db.select().from(usersTable);

  const employeeSummaries = await Promise.all(
    employees.map(async (emp) => {
      const records = await db
        .select()
        .from(timeRecordsTable)
        .where(
          and(
            eq(timeRecordsTable.employeeId, emp.id),
            gte(timeRecordsTable.date, startDate),
            lte(timeRecordsTable.date, endDate)
          )
        )
        .orderBy(sql`${timeRecordsTable.date} ASC`);

      const grouped = new Map<string, typeof records>();
      for (const record of records) {
        if (!grouped.has(record.date)) grouped.set(record.date, []);
        grouped.get(record.date)!.push(record);
      }

      const dailyBreakdown = Array.from(grouped.entries()).map(([date, dayRecords]) => {
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

      const totalHours = dailyBreakdown.reduce((sum, d) => sum + d.totalHours, 0);

      return {
        employeeId: emp.id,
        fullName: emp.fullName,
        position: emp.position,
        period: label,
        startDate,
        endDate,
        totalHours: Math.round(totalHours * 100) / 100,
        hourlyRate,
        totalEarnings: Math.round(totalHours * hourlyRate * 100) / 100,
        dailyBreakdown,
      };
    })
  );

  const totalPayout = employeeSummaries.reduce((sum, e) => sum + e.totalEarnings, 0);

  return res.json({
    period: label,
    startDate,
    endDate,
    employees: employeeSummaries,
    totalPayout: Math.round(totalPayout * 100) / 100,
    generatedAt: new Date().toISOString(),
  });
});

router.get("/my-biweekly", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { period } = req.query as { period?: string };
  const { startDate, endDate, label } = getBiweeklyDates(period);
  const employeeId = req.user!.id;

  const hourlyRate = await getHourlyRate();

  const records = await db
    .select()
    .from(timeRecordsTable)
    .where(
      and(
        eq(timeRecordsTable.employeeId, employeeId),
        gte(timeRecordsTable.date, startDate),
        lte(timeRecordsTable.date, endDate)
      )
    )
    .orderBy(sql`${timeRecordsTable.date} ASC`);

  const grouped = new Map<string, typeof records>();
  for (const record of records) {
    if (!grouped.has(record.date)) grouped.set(record.date, []);
    grouped.get(record.date)!.push(record);
  }

  const dailyBreakdown = Array.from(grouped.entries()).map(([date, dayRecords]) => {
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

  const totalHours = dailyBreakdown.reduce((sum, d) => sum + d.totalHours, 0);

  return res.json({
    employeeId,
    fullName: req.user!.fullName,
    position: req.user!.position,
    period: label,
    startDate,
    endDate,
    totalHours: Math.round(totalHours * 100) / 100,
    hourlyRate,
    totalEarnings: Math.round(totalHours * hourlyRate * 100) / 100,
    dailyBreakdown,
  });
});

export default router;
