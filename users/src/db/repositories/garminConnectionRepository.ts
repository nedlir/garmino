import pool from '../../config/db/postgres';
import { logger } from '../../utils/logger';
import {
  GarminConnectionSchema,
  CreateGarminConnectionSchema,
  UpdateGarminConnectionSchema,
  type GarminConnection,
  type CreateGarminConnection,
  type UpdateGarminConnection,
} from '../schemas/garminConnection.schema';

export const findByUserId = async (userId: string): Promise<GarminConnection | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM garmin_connections WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return GarminConnectionSchema.parse(result.rows[0]);
  } catch (err) {
    logger.error({ err, userId }, 'Error finding Garmin connection by user ID');
    throw err;
  }
};

export const create = async (data: CreateGarminConnection): Promise<GarminConnection> => {
  try {
    const validated = CreateGarminConnectionSchema.parse(data);

    const fields: string[] = ['user_id'];
    const values: any[] = [validated.user_id];
    const placeholders: string[] = ['$1'];
    let paramCount = 2;

    if (validated.garmin_oauth1_token !== undefined) {
      fields.push('garmin_oauth1_token');
      values.push(validated.garmin_oauth1_token);
      placeholders.push(`$${paramCount++}`);
    }

    if (validated.garmin_oauth2_token !== undefined) {
      fields.push('garmin_oauth2_token');
      values.push(validated.garmin_oauth2_token);
      placeholders.push(`$${paramCount++}`);
    }

    // Set connected_at to current timestamp when creating
    fields.push('connected_at');
    values.push(new Date());
    placeholders.push(`$${paramCount++}`);

    const result = await pool.query(
      `INSERT INTO garmin_connections (${fields.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING *`,
      values
    );

    return GarminConnectionSchema.parse(result.rows[0]);
  } catch (err: any) {
    // Handle unique constraint violation (user_id is primary key)
    if (err.code === '23505') {
      logger.warn({ userId: data.user_id }, 'Garmin connection already exists for user');
      throw new Error('Garmin connection already exists for this user');
    }

    logger.error({ err, data }, 'Error creating Garmin connection');
    throw err;
  }
};

export const updateByUserId = async (
  userId: string,
  data: UpdateGarminConnection
): Promise<GarminConnection | null> => {
  try {
    const validated = UpdateGarminConnectionSchema.parse(data);

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (validated.garmin_oauth1_token !== undefined) {
      fields.push(`garmin_oauth1_token = $${paramCount++}`);
      values.push(validated.garmin_oauth1_token);
    }

    if (validated.garmin_oauth2_token !== undefined) {
      fields.push(`garmin_oauth2_token = $${paramCount++}`);
      values.push(validated.garmin_oauth2_token);
    }

    if (validated.last_sync_at !== undefined) {
      fields.push(`last_sync_at = $${paramCount++}`);
      values.push(validated.last_sync_at);
    }

    if (validated.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(validated.is_active);
    }

    if (fields.length === 0) {
      const connection = await findByUserId(userId);
      return connection;
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE garmin_connections SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return GarminConnectionSchema.parse(result.rows[0]);
  } catch (err) {
    logger.error({ err, userId, data }, 'Error updating Garmin connection');
    throw err;
  }
};

export const deleteByUserId = async (userId: string): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM garmin_connections WHERE user_id = $1',
      [userId]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    logger.error({ err, userId }, 'Error deleting Garmin connection');
    throw err;
  }
};


export const createOrUpdate = async (data: CreateGarminConnection): Promise<GarminConnection> => {
  try {
    const validated = CreateGarminConnectionSchema.parse(data);

    const result = await pool.query(
      `INSERT INTO garmin_connections (user_id, garmin_oauth1_token, garmin_oauth2_token, connected_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         garmin_oauth1_token = EXCLUDED.garmin_oauth1_token,
         garmin_oauth2_token = EXCLUDED.garmin_oauth2_token,
         connected_at = NOW(),
         is_active = true,
         updated_at = NOW()
       RETURNING *`,
      [
        validated.user_id,
        validated.garmin_oauth1_token ?? null,
        validated.garmin_oauth2_token ?? null,
      ]
    );

    return GarminConnectionSchema.parse(result.rows[0]);
  } catch (err) {
    logger.error({ err, data }, 'Error creating or updating Garmin connection');
    throw err;
  }
};

export const clearTokens = async (userId: string): Promise<GarminConnection | null> => {
  try {
    const result = await pool.query(
      `UPDATE garmin_connections 
       SET garmin_oauth1_token = NULL,
           garmin_oauth2_token = NULL,
           is_active = false,
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return GarminConnectionSchema.parse(result.rows[0]);
  } catch (err) {
    logger.error({ err, userId }, 'Error clearing Garmin connection tokens');
    throw err;
  }
};
