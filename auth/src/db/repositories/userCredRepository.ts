import pool from '../../config/db/postgres';
import { logger } from '../../utils/logger';
import {
  UserCredSchema,
  CreateUserCredSchema,
  UpdateUserCredSchema,
  type UserCred,
  type CreateUserCred,
  type UpdateUserCred,
} from '../schemas/userCred.schema';

export const findAll = async (): Promise<UserCred[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_creds ORDER BY created_at DESC'
    );

    return result.rows.map((row: unknown) => UserCredSchema.parse(row));
  } catch (err) {
    logger.error({ err }, 'Error finding all users');
    throw err;
  }
};

export const findById = async (id: string): Promise<UserCred | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_creds WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return UserCredSchema.parse(result.rows[0]);
  } catch (err) {
    logger.error({ err, id }, 'Error finding user by ID');
    throw err;
  }
};

export const findByEmail = async (email: string): Promise<UserCred | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_creds WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return UserCredSchema.parse(result.rows[0]);
  } catch (err) {
    logger.error({ err, email }, 'Error finding user by email');
    throw err;
  }
};

export const create = async (data: CreateUserCred): Promise<UserCred> => {
  try {
    const validated = CreateUserCredSchema.parse(data);

    const result = await pool.query(
      `INSERT INTO user_creds (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [validated.email, validated.password_hash, validated.role]
    );

    return UserCredSchema.parse(result.rows[0]);
  } catch (err: any) {
    // Handle unique constraint violation
    if (err.code === '23505') {
      logger.warn({ email: data.email }, 'Email already exists');
      throw new Error('Email already exists');
    }

    logger.error({ err, data }, 'Error creating user');
    throw err;
  }
};

export const updateLastLogin = async (id: string): Promise<void> => {
  try {
    await pool.query(
      'UPDATE user_creds SET last_login_at = NOW() WHERE id = $1',
      [id]
    );
  } catch (err) {
    logger.error({ err, id }, 'Error updating last login');
    throw err;
  }
};

export const updateById = async (
  id: string,
  data: UpdateUserCred
): Promise<UserCred | null> => {
  try {
    const validated = UpdateUserCredSchema.parse(data);

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (validated.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(validated.email);
    }

    if (validated.password_hash !== undefined) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(validated.password_hash);
    }

    if (validated.last_login_at !== undefined) {
      fields.push(`last_login_at = $${paramCount++}`);
      values.push(validated.last_login_at);
    }

    if (fields.length === 0) {
      const user = await findById(id);
      return user;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE user_creds SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return UserCredSchema.parse(result.rows[0]);
  } catch (err: any) {
    // Handle unique constraint violation
    if (err.code === '23505') {
      logger.warn({ email: data.email }, 'Email already exists');
      throw new Error('Email already exists');
    }

    logger.error({ err, id, data }, 'Error updating user');
    throw err;
  }
};

export const deleteById = async (id: string): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM user_creds WHERE id = $1',
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    logger.error({ err, id }, 'Error deleting user');
    throw err;
  }
};
