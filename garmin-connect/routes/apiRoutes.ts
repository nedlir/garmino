import { Router } from "express";
import userRoutes from "./userRoutes";
import metricsRoutes from "./metricsRoutes";
import garminRoutes from "./garminRoutes";

const router = Router();

router.use("/user", userRoutes);
router.use("/metrics", metricsRoutes);
router.use("/garmin", garminRoutes);

export default router;
