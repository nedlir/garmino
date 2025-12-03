import { Router, Request, Response } from 'express';

const router = Router();
const startTime = Date.now();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the user service including uptime
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: users
 *                 uptime:
 *                   type: integer
 *                   description: Uptime in seconds
 *                   example: 3600
 */
router.get('/', (_req: Request, res: Response) => {
  const uptimeMs = Date.now() - startTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  res.status(200).json({
    status: 'ok',
    service: 'users',
    uptime: uptimeSeconds,
  });
});

export default router;
