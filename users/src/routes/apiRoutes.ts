import { Router } from 'express';
import profileRoute from './profileRoute';
import garminStatusRoute from './garminStatusRoute';

const router = Router();

router.use('/', profileRoute);
router.use('/', garminStatusRoute);

export default router;
