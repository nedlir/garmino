import { Request, Response } from 'express';
import * as repository from './repository';
import { CreateUserCredSchema, UpdateUserCredSchema, UserCredPublicSchema } from './schema';
import { z } from 'zod';

export const getUserCredById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const userCred = await repository.findUserCredById(id);

    if (!userCred) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const publicUser = UserCredPublicSchema.parse(userCred);
    res.status(200).json(publicUser);
  } catch (error) {
    console.error('Get user cred error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserCredByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    const userCred = await repository.findUserCredByEmail(email);

    if (!userCred) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const publicUser = UserCredPublicSchema.parse(userCred);
    res.status(200).json(publicUser);
  } catch (error) {
    console.error('Get user cred by email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUserCred = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = CreateUserCredSchema.parse(req.body);

    const existingUser = await repository.findUserCredByEmail(data.email);
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const userCred = await repository.createUserCred(data);

    const publicUser = UserCredPublicSchema.parse(userCred);
    res.status(201).json(publicUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Create user cred error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserCred = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = UpdateUserCredSchema.parse(req.body);

    const userCred = await repository.updateUserCred(id, data);

    if (!userCred) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const publicUser = UserCredPublicSchema.parse(userCred);
    res.status(200).json(publicUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Update user cred error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUserCred = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await repository.deleteUserCred(id);

    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user cred error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllUserCreds = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const userCreds = await repository.findAllUserCreds(limit, offset);
    const publicUsers = userCreds.map(user => UserCredPublicSchema.parse(user));

    res.status(200).json(publicUsers);
  } catch (error) {
    console.error('Get all user creds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
