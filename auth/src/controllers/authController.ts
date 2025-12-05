import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import * as authService from '../services/authService';
import type { RegisterRequest, LoginRequest, RefreshRequest, LogoutRequest } from '../types/requests';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: RegisterRequest = req.body;
    const result = await authService.register(data);

    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === 'Email already exists') {
      res.status(409).json({ error: err.message });
      return;
    }

    logger.error({ err }, 'Error in register controller');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: LoginRequest = req.body;
    const result = await authService.login(data);

    res.status(200).json(result);
  } catch (err: any) {
    if (err.message === 'Invalid credentials') {
      res.status(401).json({ error: err.message });
      return;
    }

    logger.error({ err }, 'Error in login controller');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: RefreshRequest = req.body;
    const result = await authService.refresh(data.refreshToken);

    res.status(200).json(result);
  } catch (err: any) {
    if (err.message === 'Invalid refresh token' || err.message === 'User not found') {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    logger.error({ err }, 'Error in refresh controller');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: LogoutRequest = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const accessToken = authHeader.substring(7);
    await authService.logout(accessToken, data.refreshToken);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err: any) {
    if (err.message === 'Invalid access token') {
      res.status(401).json({ error: err.message });
      return;
    }

    logger.error({ err }, 'Error in logout controller');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verify = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const accessToken = authHeader.substring(7);
    const result = await authService.verifyToken(accessToken);

    if (!result.valid) {
      res.status(401).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    logger.error({ err }, 'Error in verify controller');
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.headers['x-user-role'] as string;

    if (role !== 'admin') {
      res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
      return;
    }

    const users = await authService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    logger.error({ err }, 'Error in getAllUsers controller');
    res.status(500).json({ error: 'Internal server error' });
  }
};
