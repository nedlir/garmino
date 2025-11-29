import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../../src/services/authService';
import * as userCredRepository from '../../src/db/repositories/userCredRepository';
import * as tokenService from '../../src/services/tokenService';
import * as passwordService from '../../src/services/passwordService';

vi.mock('../../src/db/repositories/userCredRepository');
vi.mock('../../src/db/repositories/tokenRepository');
vi.mock('../../src/services/passwordService');

describe('Auth Integration Tests', () => {
  const testUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'integration@example.com',
    password_hash: '',
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Auth Flow', () => {
    it('should complete register -> login -> refresh -> logout flow', async () => {
      // Setup mocks
      const mockAccessToken = 'mock_access_token';
      const mockRefreshToken = 'mock_refresh_token';
      const mockNewAccessToken = 'mock_new_access_token';
      const mockNewRefreshToken = 'mock_new_refresh_token';

      vi.spyOn(passwordService, 'hashPassword').mockResolvedValue('hashed_password');
      vi.spyOn(passwordService, 'comparePassword').mockResolvedValue(true);
      vi.spyOn(tokenService, 'generateAccessToken').mockReturnValueOnce(mockAccessToken);
      vi.spyOn(tokenService, 'generateRefreshToken').mockReturnValueOnce(mockRefreshToken);
      vi.spyOn(tokenService, 'storeRefreshToken').mockResolvedValue();

      // Register
      vi.mocked(userCredRepository.create).mockResolvedValue(testUser);

      const registerResult = await authService.register({
        email: 'integration@example.com',
        password: 'password123',
      });

      expect(registerResult.accessToken).toBe(mockAccessToken);
      expect(registerResult.refreshToken).toBe(mockRefreshToken);
      expect(registerResult.user.email).toBe('integration@example.com');

      // Login
      vi.spyOn(tokenService, 'generateAccessToken').mockReturnValueOnce(mockAccessToken);
      vi.spyOn(tokenService, 'generateRefreshToken').mockReturnValueOnce(mockRefreshToken);
      vi.mocked(userCredRepository.findByEmail).mockResolvedValue(testUser);
      vi.mocked(userCredRepository.updateLastLogin).mockResolvedValue();

      const loginResult = await authService.login({
        email: 'integration@example.com',
        password: 'password123',
      });

      expect(loginResult.accessToken).toBe(mockAccessToken);
      expect(loginResult.refreshToken).toBe(mockRefreshToken);

      // Refresh
      vi.spyOn(tokenService, 'generateAccessToken').mockReturnValueOnce(mockNewAccessToken);
      vi.spyOn(tokenService, 'generateRefreshToken').mockReturnValueOnce(mockNewRefreshToken);
      vi.spyOn(tokenService, 'validateRefreshToken').mockResolvedValue(testUser.id);
      vi.spyOn(tokenService, 'revokeRefreshToken').mockResolvedValue();
      vi.mocked(userCredRepository.findById).mockResolvedValue(testUser);

      const refreshResult = await authService.refresh(mockRefreshToken);

      expect(refreshResult.accessToken).toBe(mockNewAccessToken);
      expect(refreshResult.refreshToken).toBe(mockNewRefreshToken);
      expect(refreshResult.refreshToken).not.toBe(mockRefreshToken);

      // Logout
      vi.spyOn(tokenService, 'verifyAccessToken').mockReturnValue({
        userId: testUser.id,
        email: testUser.email,
        jti: 'test-jti',
        iat: 123456,
        exp: 789012,
      });
      vi.spyOn(tokenService, 'isTokenBlacklisted').mockResolvedValue(false);
      vi.spyOn(tokenService, 'blacklistAccessToken').mockResolvedValue();

      await expect(
        authService.logout(mockNewAccessToken, mockNewRefreshToken)
      ).resolves.not.toThrow();
    });
  });
});
