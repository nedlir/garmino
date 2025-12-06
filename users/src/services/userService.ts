import { logger } from '../utils/logger';
import * as userProfileRepository from '../db/repositories/userProfileRepository';
import * as garminConnectionRepository from '../db/repositories/garminConnectionRepository';
import type { UserProfile, UpdateUserProfile } from '../db/schemas/userProfile.schema';
import type { GarminConnection, UpdateGarminConnection } from '../db/schemas/garminConnection.schema';

export interface GarminStatus {
  isConnected: boolean;
  connectedAt: Date | null;
  lastSyncAt: Date | null;
  isActive: boolean;
}

export interface UserListItem {
  userId: string;
  email: string;
  username: string | null;
}

export interface IUserService {
  getAllUsers(): Promise<UserListItem[]>;
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, requesterId: string, updates: UpdateUserProfile): Promise<UserProfile>;
  getGarminStatus(userId: string): Promise<GarminStatus>;
  updateGarminConnection(userId: string, connection: UpdateGarminConnection): Promise<GarminConnection>;
  createOrUpdateGarminConnection(userId: string, connection: UpdateGarminConnection): Promise<GarminConnection>;
  disconnectGarmin(userId: string): Promise<GarminConnection>;
}

export class UserService implements IUserService {
  async getAllUsers(): Promise<UserListItem[]> {
    try {
      logger.info('Getting all users');
      const profiles = await userProfileRepository.findAll();
      return profiles.map(profile => ({
        userId: profile.user_id,
        email: profile.email || '',
        username: profile.username,
      }));
    } catch (err) {
      logger.error({ err }, 'Error getting all users');
      throw err;
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      logger.info({ userId }, 'Getting user profile');
      const profile = await userProfileRepository.findById(userId);
      return profile;
    } catch (err) {
      logger.error({ err, userId }, 'Error getting user profile');
      throw err;
    }
  }

  async updateProfile(
    userId: string,
    requesterId: string,
    updates: UpdateUserProfile
  ): Promise<UserProfile> {
    try {
      logger.info({ userId, requesterId }, 'Updating user profile');

      if (userId !== requesterId) {
        logger.warn({ userId, requesterId }, 'Unauthorized profile update attempt');
        const error = new Error('Cannot update another user\'s profile');
        (error as any).statusCode = 403;
        throw error;
      }

      const updatedProfile = await userProfileRepository.updateById(userId, updates);

      if (!updatedProfile) {
        logger.warn({ userId }, 'User profile not found for update');
        const error = new Error('User not found');
        (error as any).statusCode = 404;
        throw error;
      }

      return updatedProfile;
    } catch (err) {
      logger.error({ err, userId, requesterId }, 'Error updating user profile');
      throw err;
    }
  }

  async getGarminStatus(userId: string): Promise<GarminStatus> {
    try {
      logger.info({ userId }, 'Getting Garmin status');
      const connection = await garminConnectionRepository.findByUserId(userId);

      if (!connection) {
        return {
          isConnected: false,
          connectedAt: null,
          lastSyncAt: null,
          isActive: false,
        };
      }

      return {
        isConnected: true,
        connectedAt: connection.connected_at,
        lastSyncAt: connection.last_sync_at,
        isActive: connection.is_active,
      };
    } catch (err) {
      logger.error({ err, userId }, 'Error getting Garmin status');
      throw err;
    }
  }

  async updateGarminConnection(
    userId: string,
    connection: UpdateGarminConnection
  ): Promise<GarminConnection> {
    try {
      logger.info({ userId }, 'Updating Garmin connection');

      const updatedConnection = await garminConnectionRepository.updateByUserId(userId, connection);

      if (!updatedConnection) {
        logger.warn({ userId }, 'Garmin connection not found for update');
        const error = new Error('Garmin connection not found');
        (error as any).statusCode = 404;
        throw error;
      }

      return updatedConnection;
    } catch (err) {
      logger.error({ err, userId }, 'Error updating Garmin connection');
      throw err;
    }
  }

  async createOrUpdateGarminConnection(
    userId: string,
    connection: UpdateGarminConnection
  ): Promise<GarminConnection> {
    try {
      logger.info({ userId }, 'Creating or updating Garmin connection');

      const existingConnection = await garminConnectionRepository.findByUserId(userId);

      if (!existingConnection) {
        const newConnection = await garminConnectionRepository.create({
          user_id: userId,
          garmin_oauth1_token: connection.garmin_oauth1_token,
          garmin_oauth2_token: connection.garmin_oauth2_token,
        });
        return newConnection;
      }

      const updatedConnection = await garminConnectionRepository.updateByUserId(userId, connection);

      if (!updatedConnection) {
        logger.error({ userId }, 'Failed to update existing Garmin connection');
        throw new Error('Failed to update Garmin connection');
      }

      return updatedConnection;
    } catch (err) {
      logger.error({ err, userId }, 'Error creating or updating Garmin connection');
      throw err;
    }
  }

  async disconnectGarmin(userId: string): Promise<GarminConnection> {
    try {
      logger.info({ userId }, 'Disconnecting Garmin account');

      const clearedConnection = await garminConnectionRepository.clearTokens(userId);

      if (!clearedConnection) {
        logger.warn({ userId }, 'Garmin connection not found for disconnect');
        const error = new Error('Garmin connection not found');
        (error as any).statusCode = 404;
        throw error;
      }

      return clearedConnection;
    } catch (err) {
      logger.error({ err, userId }, 'Error disconnecting Garmin account');
      throw err;
    }
  }
}
