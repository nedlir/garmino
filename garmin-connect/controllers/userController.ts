import { Request, Response } from "express";
import { GarminConnect } from "@gooin/garmin-connect";
import {
  LoginRequest,
  LoginResponse,
  UserProfile,
  ErrorResponse,
} from "../types";

let garminClient = new GarminConnect({
  username: process.env.GARMIN_USERNAME || "",
  password: process.env.GARMIN_PASSWORD || "",
});

let isAuthenticated = false;

export async function ensureAuthenticated() {
  if (!isAuthenticated) {
    try {
      await garminClient.login();
      isAuthenticated = true;
      console.log("Successfully authenticated with Garmin Connect");
    } catch (error: any) {
      console.error("Authentication failed:", error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
}

export function getGarminClient() {
  return garminClient;
}

export const login = async (
  req: Request<{}, LoginResponse | ErrorResponse, LoginRequest>,
  res: Response<LoginResponse | ErrorResponse>
) => {
  try {
    const { username, password } = req.body;

    // Update the shared client with new credentials
    garminClient = new GarminConnect({ username, password });
    await garminClient.login();
    isAuthenticated = true;

    res.json({
      success: true,
      message: "Successfully authenticated with Garmin Connect",
    });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response<UserProfile | ErrorResponse>
) => {
  try {
    await ensureAuthenticated();
    const profile = await garminClient.getUserProfile();
    res.json(profile);
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: error.message } as ErrorResponse);
  }
};
