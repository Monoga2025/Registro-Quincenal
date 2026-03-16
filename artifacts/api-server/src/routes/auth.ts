import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

// Simple in-memory session store (token -> userId)
// In production, use Redis or DB-backed sessions
const sessions = new Map<string, number>();

export function getSessionUserId(token: string): number | undefined {
  return sessions.get(token);
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt_employee_tracker").digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "bad_request", message: "Username and password required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  if (!user) {
    return res.status(401).json({ error: "unauthorized", message: "Invalid credentials" });
  }

  const hashedPassword = hashPassword(password);
  if (user.password !== hashedPassword) {
    return res.status(401).json({ error: "unauthorized", message: "Invalid credentials" });
  }

  const token = generateToken();
  sessions.set(token, user.id);

  const { password: _pwd, ...userWithoutPassword } = user;

  return res.json({
    user: {
      ...userWithoutPassword,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/logout", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    sessions.delete(token);
  }
  return res.json({ success: true, message: "Logged out" });
});

router.get("/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
  }

  const token = authHeader.slice(7);
  const userId = sessions.get(token);

  if (!userId) {
    return res.status(401).json({ error: "unauthorized", message: "Session expired" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    return res.status(401).json({ error: "unauthorized", message: "User not found" });
  }

  const { password: _pwd, ...userWithoutPassword } = user;
  return res.json({
    ...userWithoutPassword,
    createdAt: user.createdAt.toISOString(),
  });
});

export { hashPassword };
export default router;
