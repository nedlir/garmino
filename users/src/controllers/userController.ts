import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { UserService } from '../services/userService';
import { UpdateUserProfileSchema } from '../db/schemas/userProfile.schema';
import { ZodError } from 'zod';

const userService = new UserService();

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    logger.info({ userId }, 'Getting user profile');

    const profile = await userService.getProfile(userId);

    if (!profile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json(profile);
  } catch (err: any) {
    logger.error({ err, userId: req.params.userId }, 'Error in getProfile controller');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const requesterId = req.headers['x-user-id'] as string;

    if (!requesterId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    logger.info({ userId, requesterId }, 'Updating user profile');

    // Validate request body
    const updates = UpdateUserProfileSchema.parse(req.body);

    const updatedProfile = await userService.updateProfile(userId, requesterId, updates);

    res.status(200).json(updatedProfile);
  } catch (err: any) {
    if (err instanceof ZodError) {
      logger.warn({ errors: err.errors, body: req.body }, 'Profile update validation failed');
      res.status(400).json({
        error: 'Bad Request',
        message: 'Validation error',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    if (err.statusCode === 403) {
      res.status(403).json({
        error: 'Forbidden',
        message: err.message,
      });
      return;
    }

    if (err.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: err.message,
      });
      return;
    }

    logger.error({ err, userId: req.params.userId }, 'Error in updateProfile controller');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  }
};

export const getGarminStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    logger.info({ userId }, 'Getting Garmin status');

    const status = await userService.getGarminStatus(userId);

    res.status(200).json(status);
  } catch (err: any) {
    logger.error({ err, userId: req.params.userId }, 'Error in getGarminStatus controller');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  }
};
