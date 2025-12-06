import { Router } from "express";
import { connect, disconnect, getStatus, getActivities } from "../controllers/garminController";

const router = Router();

/**
 * @swagger
 * /api/garmin/connect:
 *   post:
 *     summary: Connect Garmin account
 *     tags: [Garmin]
 *     parameters:
 *       - in: header
 *         name: X-User-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID from authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Garmin Connect email/username
 *               password:
 *                 type: string
 *                 description: Garmin Connect password
 *     responses:
 *       200:
 *         description: Successfully connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 connectedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid credentials format
 *       401:
 *         description: Authentication failed
 */
router.post("/connect", connect);

/**
 * @swagger
 * /api/garmin/disconnect:
 *   post:
 *     summary: Disconnect Garmin account
 *     tags: [Garmin]
 *     parameters:
 *       - in: header
 *         name: X-User-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID from authentication
 *     responses:
 *       200:
 *         description: Successfully disconnected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: User not authenticated
 */
router.post("/disconnect", disconnect);

/**
 * @swagger
 * /api/garmin/status:
 *   get:
 *     summary: Get Garmin connection status
 *     tags: [Garmin]
 *     parameters:
 *       - in: header
 *         name: X-User-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID from authentication
 *     responses:
 *       200:
 *         description: Connection status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isConnected:
 *                   type: boolean
 *                 connectedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 lastSyncAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 isActive:
 *                   type: boolean
 *       401:
 *         description: User not authenticated
 */
router.get("/status", getStatus);

/**
 * @swagger
 * /api/garmin/activities:
 *   get:
 *     summary: Get user's Garmin activities
 *     tags: [Garmin]
 *     parameters:
 *       - in: header
 *         name: X-User-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID from authentication
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
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       activityId:
 *                         type: number
 *                       activityName:
 *                         type: string
 *                       activityType:
 *                         type: string
 *                       startTimeLocal:
 *                         type: string
 *                         format: date-time
 *                       distance:
 *                         type: number
 *                       duration:
 *                         type: number
 *                       calories:
 *                         type: number
 *                       averageHR:
 *                         type: number
 *                         nullable: true
 *                 total:
 *                   type: number
 *                 start:
 *                   type: number
 *                 limit:
 *                   type: number
 *       401:
 *         description: User not authenticated or no active connection
 */
router.get("/activities", getActivities);

export default router;
