import pool from '../config/postgres';
import { UserCred, CreateUserCred, UpdateUserCred, UserCredSchema } from './schema';

export const findUserCredById = async (id: string): Promise<UserCred | null> => {
  const result = await pool.query(
    'SELECT * FROM user_creds WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return UserCredSchema.parse(result.rows[0]);
};

export const findUserCredByEmail = async (email: string): Promise<UserCred | null> => {
  const result = await pool.query(
    'SELECT * FROM user_creds WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return UserCredSchema.parse(result.rows[0]);
};

export const createUserCred = async (data: CreateUserCred): Promise<UserCred> => {
  const result = await pool.query(
    `INSERT INTO user_creds (email, password_hash) 
     VALUES ($1, $2) 
     RETURNING *`,
    [data.email, data.password_hash]
  );

  return UserCredSchema.parse(result.rows[0]);
};

export const updateUserCred = async (id: string, data: UpdateUserCred): Promise<UserCred | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(data.email);
  }
  if (data.password_hash !== undefined) {
    fields.push(`password_hash = $${paramCount++}`);
    values.push(data.password_hash);
  }
  if (data.email_verified !== undefined) {
    fields.push(`email_verified = $${paramCount++}`);
    values.push(data.email_verified);
  }
  if (data.is_active !== undefined) {
    fields.push(`is_active = $${paramCount++}`);
    values.push(data.is_active);
  }
  if (data.last_login_at !== undefined) {
    fields.push(`last_login_at = $${paramCount++}`);
    values.push(data.last_login_at);
  }

  if (fields.length === 0) {
    return findUserCredById(id);
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE user_creds 
     SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  return UserCredSchema.parse(result.rows[0]);
};

export const deleteUserCred = async (id: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM user_creds WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rows.length > 0;
};

export const findAllUserCreds = async (limit: number = 100, offset: number = 0): Promise<UserCred[]> => {
  const result = await pool.query(
    'SELECT * FROM user_creds ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return result.rows.map(row => UserCredSchema.parse(row));
};

export const updateLastLogin = async (id: string): Promise<void> => {
  await pool.query(
    'UPDATE user_creds SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );
};
