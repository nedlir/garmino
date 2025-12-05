import { Router, Request, Response } from 'express';

const router = Router();

const startTime = Date.now();

router.get('/', (_req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  res.status(200).json({
    service: 'gateway',
    status: 'healthy',
    uptime,
  });
});

export default router;
