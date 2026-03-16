import { Router, type IRouter } from "express";
import { db, usersTable, timeRecordsTable, hourlyRateSettingsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middlewares/auth.js";
import { hashPassword } from "./auth.js";

const router: IRouter = Router();

router.get("/", requireAdmin, async (_req, res) => {
  const employees = await db.select().from(usersTable);

  // Get current hourly rate
  const [rateSetting] = await db
    .select()
    .from(hourlyRateSettingsTable)
    .orderBy(sql`${hourlyRateSettingsTable.updatedAt} DESC`)
    .limit(1);
  const hourlyRate = rateSetting?.rate ?? 10;

  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const result = await Promise.all(
    employees.map(async (emp) => {
      const records = await db
        .select()
        .from(timeRecordsTable)
        .where(
          and(
            eq(timeRecordsTable.employeeId, emp.id),
            gte(timeRecordsTable.date, startOfMonth),
            lte(timeRecordsTable.date, endOfMonth)
          )
        );

      const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
      const { password: _pwd, ...empWithoutPassword } = emp;

      return {
        ...empWithoutPassword,
        createdAt: emp.createdAt.toISOString(),
        totalHoursThisMonth: Math.round(totalHours * 100) / 100,
        totalEarningsThisMonth: Math.round(totalHours * hourlyRate * 100) / 100,
      };
    })
  );

  return res.json(result);
});

router.post("/", requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { username, password, fullName, position, role } = req.body;

  if (!username || !password || !fullName || !position) {
    return res.status(400).json({ error: "bad_request", message: "All fields required" });
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    return res.status(409).json({ error: "conflict", message: "Username already exists" });
  }

  const hashedPassword = hashPassword(password);

  const [employee] = await db
    .insert(usersTable)
    .values({
      username,
      password: hashedPassword,
      fullName,
      position: position || "",
      role: role || "employee",
    })
    .returning();

  const { password: _pwd, ...empWithoutPassword } = employee;
  return res.status(201).json({
    ...empWithoutPassword,
    createdAt: employee.createdAt.toISOString(),
    totalHoursThisMonth: 0,
    totalEarningsThisMonth: 0,
  });
});

router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = parseInt(req.params.id);

  // Employees can only view their own profile
  if (req.user?.role !== "admin" && req.user?.id !== id) {
    return res.status(403).json({ error: "forbidden", message: "Access denied" });
  }

  const [employee] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!employee) {
    return res.status(404).json({ error: "not_found", message: "Employee not found" });
  }

  const { password: _pwd, ...empWithoutPassword } = employee;
  return res.json({
    ...empWithoutPassword,
    createdAt: employee.createdAt.toISOString(),
    totalHoursThisMonth: 0,
    totalEarningsThisMonth: 0,
  });
});

router.put("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { fullName, position, role, password } = req.body;

  const updateData: Record<string, string> = {};
  if (fullName) updateData.fullName = fullName;
  if (position) updateData.position = position;
  if (role) updateData.role = role;
  if (password) updateData.password = hashPassword(password);

  const [employee] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, id))
    .returning();

  if (!employee) {
    return res.status(404).json({ error: "not_found", message: "Employee not found" });
  }

  const { password: _pwd, ...empWithoutPassword } = employee;
  return res.json({
    ...empWithoutPassword,
    createdAt: employee.createdAt.toISOString(),
    totalHoursThisMonth: 0,
    totalEarningsThisMonth: 0,
  });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.json({ success: true, message: "Employee deleted" });
});

export default router;
