import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSessionUserId } from "../routes/auth.js";

export interface AuthenticatedRequest extends Request {
  user?: typeof usersTable.$inferSelect;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
  }

  const token = authHeader.slice(7);
  const userId = getSessionUserId(token);

  if (!userId) {
    return res.status(401).json({ error: "unauthorized", message: "Session expired" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    return res.status(401).json({ error: "unauthorized", message: "User not found" });
  }

  req.user = user;
  next();
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "forbidden", message: "Admin access required" });
    }
    next();
  });
}
