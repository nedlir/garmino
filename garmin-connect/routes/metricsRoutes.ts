import { Router } from "express";
import {
  getActivities,
  getActivityDetails,
} from "../controllers/metricsController";

const router = Router();

/**
 * @swagger
 * /api/metrics/activities:
 *   get:
 *     summary: Get list of activities
 *     tags: [Metrics]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Starting index for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: List of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/activities", getActivities);

/**
 * @swagger
 * /api/metrics/activities/{activityId}:
 *   get:
 *     summary: Get detailed information about a specific activity
 *     tags: [Metrics]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/activities/:activityId", getActivityDetails);

export default router;
