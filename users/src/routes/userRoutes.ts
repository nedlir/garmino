import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

router.get('/:userId', userController.getProfile);

router.put('/:userId', userController.updateProfile);

router.get('/:userId/garmin-status', userController.getGarminStatus);

export default router;
