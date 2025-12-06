import { describe, it, expect, beforeEach, vi } from 'vitest';
import { disconnect } from '../controllers/garminController';
import { GarminSessionManager } from '../services/GarminSessionManager';
import * as userServiceClient from '../services/userServiceClient';
import { Request, Response } from 'express';

// Mock the dependencies
vi.mock('../services/userServiceClient');

describe('Disconnect Endpoint', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: any;
  let responseStatus: number;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup response mock
    responseJson = {};
    responseStatus = 200;

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((data) => {
        responseJson = data;
        return mockResponse as Response;
      }),
    };

    // Setup request mock
    mockRequest = {
      headers: {
        'x-user-id': 'test-user-123',
      },
    };
  });

  it('should successfully disconnect a user', async () => {
    // Mock clearGarminTokens to succeed
    vi.mocked(userServiceClient.clearGarminTokens).mockResolvedValue();

    await disconnect(mockRequest as Request, mockResponse as Response);

    // Verify clearGarminTokens was called with correct userId
    expect(userServiceClient.clearGarminTokens).toHaveBeenCalledWith('test-user-123');

    // Verify response
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Successfully disconnected from Garmin Connect',
    });
  });

  it('should return 401 when X-User-Id header is missing', async () => {
    mockRequest.headers = {};

    await disconnect(mockRequest as Request, mockResponse as Response);

    // Verify clearGarminTokens was NOT called
    expect(userServiceClient.clearGarminTokens).not.toHaveBeenCalled();

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'User ID not found in request headers',
    });
  });

  it('should handle errors from user service', async () => {
    // Mock clearGarminTokens to fail
    vi.mocked(userServiceClient.clearGarminTokens).mockRejectedValue(
      new Error('Database connection failed')
    );

    await disconnect(mockRequest as Request, mockResponse as Response);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Database connection failed',
    });
  });
});
