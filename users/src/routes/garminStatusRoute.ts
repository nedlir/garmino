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

/**
 * @swagger
 * /users/{userId}/garmin-connection:
 *   put:
 *     summary: Update Garmin connection
 *     description: Create or update Garmin connection tokens for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               garmin_oauth1_token:
 *                 type: string
 *                 nullable: true
 *               garmin_oauth2_token:
 *                 type: string
 *                 nullable: true
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Garmin connection updated successfully
 *       500:
 *         description: Server error
 */
router.put('/:userId/garmin-connection', userController.updateGarminConnection);

/**
 * @swagger
 * /users/{userId}/garmin-connection:
 *   get:
 *     summary: Get Garmin connection
 *     description: Retrieve Garmin connection tokens for a user
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
 *         description: Garmin connection retrieved successfully
 *       404:
 *         description: Connection not found
 *       500:
 *         description: Server error
 */
router.get('/:userId/garmin-connection', async (req, res) => {
  try {
    const { userId } = req.params;
    const { findByUserId } = await import('../db/repositories/garminConnectionRepository');
    const connection = await findByUserId(userId);
    
    if (!connection) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Garmin connection not found',
      });
      return;
    }
    
    res.status(200).json(connection);
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  }
});

export default router;
