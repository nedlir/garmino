import pool from '../../config/db/postgres';
import { logger } from '../../utils/logger';
import {
  UserProfileSchema,
  CreateUserProfileSchema,
  UpdateUserProfileSchema,
  type UserProfile,
  type CreateUserProfile,
  type UpdateUserProfile,
} from '../schemas/userProfile.schema';

export const findAll = async (): Promise<UserProfile[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_profiles ORDER BY created_at DESC'
    );

    return result.rows.map(row => UserProfileSchema.parse(row));
  } catch (err) {
    logger.error({ err }, 'Error finding all user profiles');
    throw err;
  }
};

export const findById = async (userId: string): Promise<UserProfile | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return UserProfileSchema.parse(result.rows[0]);
  } catch (err) {
    logger.error({ err, userId }, 'Error finding user profile by ID');
    throw err;
  }
};

export const findByUsername = async (username: string): Promise<UserProfile | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return UserProfileSchema.parse(result.rows[0]);
  } catch (err) {
    logger.error({ err, username }, 'Error finding user profile by username');
    throw err;
  }
};

export const create = async (data: CreateUserProfile): Promise<UserProfile> => {
  try {
    const validated = CreateUserProfileSchema.parse(data);

    const fields: string[] = ['user_id'];
    const values: any[] = [validated.user_id];
    const placeholders: string[] = ['$1'];
    let paramCount = 2;

    if (validated.username !== undefined) {
      fields.push('username');
      values.push(validated.username);
      placeholders.push(`$${paramCount++}`);
    }

    if (validated.first_name !== undefined) {
      fields.push('first_name');
      values.push(validated.first_name);
      placeholders.push(`$${paramCount++}`);
    }

    if (validated.last_name !== undefined) {
      fields.push('last_name');
      values.push(validated.last_name);
      placeholders.push(`$${paramCount++}`);
    }

    if (validated.avatar_url !== undefined) {
      fields.push('avatar_url');
      values.push(validated.avatar_url);
      placeholders.push(`$${paramCount++}`);
    }

    if (validated.bio !== undefined) {
      fields.push('bio');
      values.push(validated.bio);
      placeholders.push(`$${paramCount++}`);
    }

    const result = await pool.query(
      `INSERT INTO user_profiles (${fields.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING *`,
      values
    );

    return UserProfileSchema.parse(result.rows[0]);
  } catch (err: any) {
    // Handle unique constraint violation
    if (err.code === '23505') {
      logger.warn({ username: data.username }, 'Username already exists');
      throw new Error('Username already exists');
    }

    logger.error({ err, data }, 'Error creating user profile');
    throw err;
  }
};

export const updateById = async (
  userId: string,
  data: UpdateUserProfile
): Promise<UserProfile | null> => {
  try {
    const validated = UpdateUserProfileSchema.parse(data);

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (validated.username !== undefined) {
      fields.push(`username = $${paramCount++}`);
      values.push(validated.username);
    }

    if (validated.first_name !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(validated.first_name);
    }

    if (validated.last_name !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(validated.last_name);
    }

    if (validated.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(validated.avatar_url);
    }

    if (validated.bio !== undefined) {
      fields.push(`bio = $${paramCount++}`);
      values.push(validated.bio);
    }

    if (fields.length === 0) {
      const profile = await findById(userId);
      return profile;
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return UserProfileSchema.parse(result.rows[0]);
  } catch (err: any) {
    // Handle unique constraint violation
    if (err.code === '23505') {
      logger.warn({ username: data.username }, 'Username already exists');
      throw new Error('Username already exists');
    }

    logger.error({ err, userId, data }, 'Error updating user profile');
    throw err;
  }
};

export const deleteById = async (userId: string): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    logger.error({ err, userId }, 'Error deleting user profile');
    throw err;
  }
};
