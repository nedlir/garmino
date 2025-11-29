import { logger } from '../utils/logger';
import * as userCredRepository from '../db/repositories/userCredRepository';
import * as passwordService from './passwordService';
import * as tokenService from './tokenService';
import type { RegisterRequest, LoginRequest } from '../types/requests';
import type { AuthResponse, VerifyResponse } from '../types/responses';

export const register = async (
  data: RegisterRequest
): Promise<AuthResponse> => {
  try {
    logger.info({ email: data.email }, 'Registering new user');

    const passwordHash = await passwordService.hashPassword(data.password);

    const user = await userCredRepository.create({
      email: data.email,
      password_hash: passwordHash,
    });

    const accessToken = tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = tokenService.generateRefreshToken();

    await tokenService.storeRefreshToken(refreshToken, user.id);

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (err) {
    logger.error({ err, email: data.email }, 'Error registering user');
    throw err;
  }
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    logger.info({ email: data.email }, 'User login attempt');

    // Find user
    const user = await userCredRepository.findByEmail(data.email);
    if (!user) {
      logger.warn({ email: data.email }, 'User not found');
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await passwordService.comparePassword(
      data.password,
      user.password_hash
    );
    if (!isValid) {
      logger.warn({ email: data.email }, 'Invalid password');
      throw new Error('Invalid credentials');
    }

    await userCredRepository.updateLastLogin(user.id);

    const accessToken = tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = tokenService.generateRefreshToken();

    await tokenService.storeRefreshToken(refreshToken, user.id);

    logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (err) {
    logger.error({ err, email: data.email }, 'Error logging in user');
    throw err;
  }
};

export const refresh = async (refreshToken: string): Promise<AuthResponse> => {
  try {
    logger.info('Refreshing access token');

    // Validate refresh token
    const userId = await tokenService.validateRefreshToken(refreshToken);
    if (!userId) {
      logger.warn('Invalid refresh token');
      throw new Error('Invalid refresh token');
    }

    // Get user
    const user = await userCredRepository.findById(userId);
    if (!user) {
      logger.warn({ userId }, 'User not found for refresh token');
      throw new Error('User not found');
    }

    const newAccessToken = tokenService.generateAccessToken(user.id, user.email);
    const newRefreshToken = tokenService.generateRefreshToken();

    await tokenService.revokeRefreshToken(refreshToken);

    await tokenService.storeRefreshToken(newRefreshToken, user.id);

    logger.info({ userId: user.id, email: user.email }, 'Access token refreshed successfully');

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (err) {
    logger.error({ err }, 'Error refreshing access token');
    throw err;
  }
};

export const logout = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    logger.info('User logout');

    // Verify JWT (this will throw if invalid or expired)
    const payload = tokenService.verifyAccessToken(accessToken);

    // Check if already blacklisted
    const isBlacklisted = await tokenService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      logger.warn({ jti: payload.jti }, 'Token is already blacklisted');
      throw new Error('Invalid access token');
    }

    await tokenService.blacklistAccessToken(payload.jti);

    await tokenService.revokeRefreshToken(refreshToken);

    logger.info({ userId: payload.userId, jti: payload.jti }, 'User logged out successfully');
  } catch (err: any) {
    // Re-throw token validation errors with consistent message
    if (err.message === 'Invalid token' || err.message === 'Token expired') {
      logger.warn({ err: err.message }, 'Invalid access token for logout');
      throw new Error('Invalid access token');
    }
    logger.error({ err }, 'Error logging out user');
    throw err;
  }
};

export const verifyToken = async (
  accessToken: string
): Promise<VerifyResponse> => {
  try {
    // Verify JWT
    const payload = tokenService.verifyAccessToken(accessToken);

    const isBlacklisted = await tokenService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      logger.warn({ jti: payload.jti }, 'Token is blacklisted');
      return { valid: false };
    }

    logger.debug({ userId: payload.userId, jti: payload.jti }, 'Token verified successfully');

    return {
      valid: true,
      userId: payload.userId,
      email: payload.email,
    };
  } catch (err) {
    logger.warn({ err }, 'Token verification failed');
    return { valid: false };
  }
};
