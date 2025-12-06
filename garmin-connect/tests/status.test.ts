import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStatus } from '../controllers/garminController';
import * as userServiceClient from '../services/userServiceClient';
import type { Request, Response } from 'express';

vi.mock('../services/userServiceClient');

describe('Status Endpoint', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {},
    };
    
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if X-User-Id header is missing', async () => {
    await getStatus(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'User ID not found in request headers',
    });
  });

  it('should return connection status for connected user', async () => {
    const userId = 'test-user-123';
    const mockStatus = {
      isConnected: true,
      connectedAt: '2024-01-01T00:00:00.000Z',
      lastSyncAt: '2024-01-02T00:00:00.000Z',
      isActive: true,
    };

    mockRequest.headers = { 'x-user-id': userId };
    vi.mocked(userServiceClient.getGarminStatus).mockResolvedValue(mockStatus);

    await getStatus(mockRequest as Request, mockResponse as Response);

    expect(userServiceClient.getGarminStatus).toHaveBeenCalledWith(userId);
    expect(jsonMock).toHaveBeenCalledWith(mockStatus);
  });

  it('should return connection status for non-connected user', async () => {
    const userId = 'test-user-456';
    const mockStatus = {
      isConnected: false,
      connectedAt: null,
      lastSyncAt: null,
      isActive: false,
    };

    mockRequest.headers = { 'x-user-id': userId };
    vi.mocked(userServiceClient.getGarminStatus).mockResolvedValue(mockStatus);

    await getStatus(mockRequest as Request, mockResponse as Response);

    expect(userServiceClient.getGarminStatus).toHaveBeenCalledWith(userId);
    expect(jsonMock).toHaveBeenCalledWith(mockStatus);
  });

  it('should handle errors from user service', async () => {
    const userId = 'test-user-789';
    const errorMessage = 'Database connection failed';

    mockRequest.headers = { 'x-user-id': userId };
    vi.mocked(userServiceClient.getGarminStatus).mockRejectedValue(new Error(errorMessage));

    await getStatus(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: errorMessage,
    });
  });
});
