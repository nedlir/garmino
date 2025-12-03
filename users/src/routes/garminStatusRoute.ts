import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

/**
 * @swagger
 * /users/{userId}/garmin-status:
 *   get:
 *     summary: Get Garmin connection status
 *     description: Retrieve the Garmin connection status for a user including connection state, last sync time, and active status
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Garmin status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GarminStatus'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:userId/garmin-status', userController.getGarminStatus);

export default router;
