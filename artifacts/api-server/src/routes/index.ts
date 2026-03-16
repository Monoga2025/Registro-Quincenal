import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import employeesRouter from "./employees.js";
import recordsRouter from "./records.js";
import reportsRouter from "./reports.js";
import settingsRouter from "./settings.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/employees", employeesRouter);
router.use("/records", recordsRouter);
router.use("/reports", reportsRouter);
router.use("/settings", settingsRouter);

export default router;
