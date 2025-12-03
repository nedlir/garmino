import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve a user's profile information including username, name, avatar, and bio
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
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:userId', userController.getProfile);

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update user profile
 *     description: Update a user's profile information. Users can only update their own profile.
 *     tags: [Users]
 *     security:
 *       - UserIdHeader: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: header
 *         name: X-User-Id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Authenticated user ID (set by API Gateway)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Username
 *               first_name:
 *                 type: string
 *                 maxLength: 100
 *                 description: First name
 *               last_name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Last name
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *                 description: Avatar URL
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 description: User bio
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Cannot update another user's profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:userId', userController.updateProfile);

export default router;
