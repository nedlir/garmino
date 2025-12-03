import { Router, Request, Response } from 'express';

const router = Router();
const startTime = Date.now();

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
