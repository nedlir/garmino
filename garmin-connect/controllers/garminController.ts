import { Request, Response } from "express";
import { GarminSessionManager } from "../services/GarminSessionManager";
import * as userServiceClient from "../services/userServiceClient";
import {
  ConnectRequest,
  ConnectResponse,
  DisconnectResponse,
  ConnectionStatus,
  ErrorResponse,
  ActivityListParams,
  ActivitiesResponse,
  ActivitySummary,
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

    sessionManager.removeClient(userId);

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


export const getActivities = async (
  req: Request<{}, ActivitiesResponse | ErrorResponse, {}, ActivityListParams>,
  res: Response<ActivitiesResponse | ErrorResponse>
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

    // Parse pagination parameters
    const start = req.query.start ? parseInt(String(req.query.start)) : 0;
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 20;

    const status = await userServiceClient.getGarminStatus(userId);
    
    if (!status.isConnected || !status.isActive) {
      res.status(401).json({
        success: false,
        error: "NOT_CONNECTED",
      });
      return;
    }

    const tokens = await userServiceClient.getGarminTokens(userId);
    
    if (!tokens) {
      res.status(401).json({
        success: false,
        error: "No active Garmin connection. Please connect your account.",
      });
      return;
    }

    let client = sessionManager.getClient(userId);
    
    if (!client) {
      // Restore client from stored tokens
      try {
        const oauth1 = JSON.parse(tokens.oauth1);
        const oauth2 = JSON.parse(tokens.oauth2);
        client = sessionManager.restoreClient(userId, { oauth1, oauth2 });
      } catch (error) {
        res.status(401).json({
          success: false,
          error: "Failed to restore Garmin session. Please reconnect your account.",
        });
        return;
      }
    }

    try {
      const activities = await client.getActivities(start, limit);
      
      // Transform activities to match our ActivitySummary interface
      const activitySummaries: ActivitySummary[] = activities.map((activity: any) => ({
        activityId: activity.activityId,
        activityName: activity.activityName,
        activityType: activity.activityType?.typeKey || activity.activityType || "unknown",
        startTimeLocal: activity.startTimeLocal,
        distance: activity.distance || 0,
        duration: activity.duration || 0,
        calories: activity.calories || 0,
        averageHR: activity.averageHR,
      }));

      // Update last sync time
      await userServiceClient.storeGarminTokens(userId, {
        oauth1: tokens.oauth1,
        oauth2: tokens.oauth2,
      });

      res.json({
        activities: activitySummaries,
        total: activitySummaries.length,
        start,
        limit,
      });
    } catch (error: any) {
      // Check if it's a session expiry error
      if (error.message?.includes("401") || error.message?.includes("unauthorized")) {
        sessionManager.removeClient(userId);
        
        res.status(401).json({
          success: false,
          error: "Garmin session expired. Please reconnect your account.",
        });
        return;
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error("Error in getActivities:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};
