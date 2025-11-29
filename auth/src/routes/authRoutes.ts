import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validateBody } from '../middleware/validateRequest';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
  LogoutRequestSchema,
} from '../types/requests';

const router = Router();

router.post('/register', validateBody(RegisterRequestSchema), authController.register);
router.post('/login', validateBody(LoginRequestSchema), authController.login);
router.post('/refresh', validateBody(RefreshRequestSchema), authController.refresh);
router.post('/logout', validateBody(LogoutRequestSchema), authController.logout);
router.post('/verify', authController.verify);

export default router;
