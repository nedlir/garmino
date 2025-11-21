import { Router } from "express";
import userRoutes from "./userRoutes";
import metricsRoutes from "./metricsRoutes";

const router = Router();

router.use("/user", userRoutes);
router.use("/metrics", metricsRoutes);

export default router;
