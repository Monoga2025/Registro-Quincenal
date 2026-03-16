import { Router, type IRouter } from "express";
import { db, hourlyRateSettingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/hourly-rate", requireAuth, async (_req, res) => {
  const [setting] = await db
    .select()
    .from(hourlyRateSettingsTable)
    .orderBy(sql`${hourlyRateSettingsTable.updatedAt} DESC`)
    .limit(1);

  if (!setting) {
    // Create default setting
    const [created] = await db
      .insert(hourlyRateSettingsTable)
      .values({ rate: 10, updatedAt: new Date() })
      .returning();
    return res.json({
      ...created,
      updatedAt: created.updatedAt.toISOString(),
    });
  }

  return res.json({
    ...setting,
    updatedAt: setting.updatedAt.toISOString(),
  });
});

router.put("/hourly-rate", requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { rate } = req.body;

  if (typeof rate !== "number" || rate <= 0) {
    return res.status(400).json({ error: "bad_request", message: "Rate must be a positive number" });
  }

  const [created] = await db
    .insert(hourlyRateSettingsTable)
    .values({
      rate,
      updatedAt: new Date(),
      updatedBy: req.user!.id,
    })
    .returning();

  return res.json({
    ...created,
    updatedAt: created.updatedAt.toISOString(),
  });
});

export default router;
