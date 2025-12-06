import { Request, Response } from "express";
import { GarminSessionManager } from "../services/GarminSessionManager";
import * as userServiceClient from "../services/userServiceClient";
import {
  ConnectRequest,
  ConnectResponse,
  DisconnectResponse,
  ConnectionStatus,
  ErrorResponse,
} from "../types";

const sessionManager = new GarminSessionManager();

/**
 * POST /api/garmin/connect
 * Connect a user's Garmin account
 */
export const connect = async (
  req: Request<{}, ConnectResponse | ErrorResponse, ConnectRequest>,
  res: Response<ConnectResponse | ErrorResponse>
) => {
  try {
    const { username, password } = req.body;
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "User ID not found in request headers",
      });
      return;
    }

    // Validate credentials
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: "Invalid Garmin username or password",
      });
      return;
    }

    // Create and authenticate Garmin client
    try {
      const client = await sessionManager.createClient(userId, {
        username,
        password,
      });

      // Get the session tokens
      const sessionData = sessionManager.getSerializedSession(userId);
      
      if (!sessionData) {
        throw new Error("Failed to retrieve session data");
      }

      // Store tokens in User Service
      await userServiceClient.storeGarminTokens(userId, {
        oauth1: JSON.stringify(sessionData.oauth1),
        oauth2: JSON.stringify(sessionData.oauth2),
      });

      res.json({
        success: true,
        message: "Successfully connected to Garmin Connect",
        connectedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      // Authentication failed
      res.status(401).json({
        success: false,
        error: "Invalid Garmin username or password",
      });
    }
  } catch (error: any) {
    console.error("Error in connect:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};

/**
 * POST /api/garmin/disconnect
 * Disconnect a user's Garmin account
 */
export const disconnect = async (
  req: Request,
  res: Response<DisconnectResponse | ErrorResponse>
) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "User ID not found in request headers",
      });
      return;
    }

    // Remove client from session manager
    sessionManager.removeClient(userId);

    // Clear tokens in User Service
    await userServiceClient.clearGarminTokens(userId);

    res.json({
      success: true,
      message: "Successfully disconnected from Garmin Connect",
    });
  } catch (error: any) {
    console.error("Error in disconnect:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};

/**
 * GET /api/garmin/status
 * Get Garmin connection status for a user
 */
export const getStatus = async (
  req: Request,
  res: Response<ConnectionStatus | ErrorResponse>
) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "User ID not found in request headers",
      });
      return;
    }

    // Get status from User Service
    const status = await userServiceClient.getGarminStatus(userId);

    res.json(status);
  } catch (error: any) {
    console.error("Error in getStatus:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};
