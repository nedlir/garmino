import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../../../src/services/authService';
import * as userCredRepository from '../../../src/db/repositories/userCredRepository';
import * as passwordService from '../../../src/services/passwordService';
import * as tokenService from '../../../src/services/tokenService';

vi.mock('../../../src/db/repositories/userCredRepository');
vi.mock('../../../src/services/passwordService');
vi.mock('../../../src/services/tokenService');

describe('authService', () => {
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(passwordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(userCredRepository.create).mockResolvedValue(mockUser);
      vi.mocked(tokenService.generateAccessToken).mockReturnValue('access_token');
      vi.mocked(tokenService.generateRefreshToken).mockReturnValue('refresh_token');
      vi.mocked(tokenService.storeRefreshToken).mockResolvedValue();

      const result = await authService.register(registerData);

      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });
      expect(passwordService.hashPassword).toHaveBeenCalledWith('password123');
      expect(userCredRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password_hash: 'hashed_password',
      });
    });

    it('should throw error if email already exists', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(passwordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(userCredRepository.create).mockRejectedValue(new Error('Email already exists'));

      await expect(authService.register(registerData)).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(userCredRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(passwordService.comparePassword).mockResolvedValue(true);
      vi.mocked(userCredRepository.updateLastLogin).mockResolvedValue();
      vi.mocked(tokenService.generateAccessToken).mockReturnValue('access_token');
      vi.mocked(tokenService.generateRefreshToken).mockReturnValue('refresh_token');
      vi.mocked(tokenService.storeRefreshToken).mockResolvedValue();

      const result = await authService.login(loginData);

      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });
      expect(userCredRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error if user not found', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(userCredRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is invalid', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      vi.mocked(userCredRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(passwordService.comparePassword).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'old_refresh_token';

      vi.mocked(tokenService.validateRefreshToken).mockResolvedValue(mockUser.id);
      vi.mocked(userCredRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(tokenService.generateAccessToken).mockReturnValue('new_access_token');
      vi.mocked(tokenService.generateRefreshToken).mockReturnValue('new_refresh_token');
      vi.mocked(tokenService.revokeRefreshToken).mockResolvedValue();
      vi.mocked(tokenService.storeRefreshToken).mockResolvedValue();

      const result = await authService.refresh(refreshToken);

      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });
      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw error if refresh token is invalid', async () => {
      vi.mocked(tokenService.validateRefreshToken).mockResolvedValue(null);

      await expect(authService.refresh('invalid_token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user not found', async () => {
      vi.mocked(tokenService.validateRefreshToken).mockResolvedValue(mockUser.id);
      vi.mocked(userCredRepository.findById).mockResolvedValue(null);

      await expect(authService.refresh('refresh_token')).rejects.toThrow('User not found');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';
      const mockPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        jti: 'jti_value',
        iat: 123456,
        exp: 789012,
      };

      vi.mocked(tokenService.verifyAccessToken).mockReturnValue(mockPayload);
      vi.mocked(tokenService.isTokenBlacklisted).mockResolvedValue(false);
      vi.mocked(tokenService.blacklistAccessToken).mockResolvedValue();
      vi.mocked(tokenService.revokeRefreshToken).mockResolvedValue();

      await authService.logout(accessToken, refreshToken);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith(accessToken);
      expect(tokenService.isTokenBlacklisted).toHaveBeenCalledWith('jti_value');
      expect(tokenService.blacklistAccessToken).toHaveBeenCalledWith('jti_value');
      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw error if access token is invalid', async () => {
      vi.mocked(tokenService.verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.logout('invalid_token', 'refresh_token')).rejects.toThrow('Invalid access token');
    });

    it('should throw error if token is already blacklisted', async () => {
      const mockPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        jti: 'jti_value',
        iat: 123456,
        exp: 789012,
      };

      vi.mocked(tokenService.verifyAccessToken).mockReturnValue(mockPayload);
      vi.mocked(tokenService.isTokenBlacklisted).mockResolvedValue(true);

      await expect(authService.logout('access_token', 'refresh_token')).rejects.toThrow('Invalid access token');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        jti: 'jti_value',
        iat: 123456,
        exp: 789012,
      };

      vi.mocked(tokenService.verifyAccessToken).mockReturnValue(mockPayload);
      vi.mocked(tokenService.isTokenBlacklisted).mockResolvedValue(false);

      const result = await authService.verifyToken('access_token');

      expect(result).toEqual({
        valid: true,
        userId: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should return invalid if token is blacklisted', async () => {
      const mockPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        jti: 'jti_value',
        iat: 123456,
        exp: 789012,
      };

      vi.mocked(tokenService.verifyAccessToken).mockReturnValue(mockPayload);
      vi.mocked(tokenService.isTokenBlacklisted).mockResolvedValue(true);

      const result = await authService.verifyToken('access_token');

      expect(result).toEqual({ valid: false });
    });

    it('should return invalid if token verification fails', async () => {
      vi.mocked(tokenService.verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.verifyToken('invalid_token');

      expect(result).toEqual({ valid: false });
    });
  });
});
