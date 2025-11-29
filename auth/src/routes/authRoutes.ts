import { Router } from 'express';

const router = Router();

router.post('/register', () => (console.log("register")));
router.post('/login', () => (console.log("login")));
router.post('/refresh', () => (console.log("refresh")));
router.post('/logout', () => (console.log("logout")));

export default router;