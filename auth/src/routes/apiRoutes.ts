import { Router } from 'express';
import registerRoute from './registerRoute';
import loginRoute from './loginRoute';
import refreshRoute from './refreshRoute';
import logoutRoute from './logoutRoute';
import verifyRoute from './verifyRoute';
import usersRoute from './usersRoute';

const router = Router();

router.use('/register', registerRoute);
router.use('/login', loginRoute);
router.use('/refresh', refreshRoute);
router.use('/logout', logoutRoute);
router.use('/verify', verifyRoute);
router.use('/users', usersRoute);

export default router;
