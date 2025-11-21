import { Request, Response } from "express";
import { getGarminClient, ensureAuthenticated } from "./userController";
import {
  GetActivitiesQuery,
  GetActivityDetailsParams,
  ActivitiesResponse,
  ActivityDetails,
  ErrorResponse,
} from "../types";

export const getActivities = async (
  req: Request<{}, any, {}, GetActivitiesQuery>,
  res: Response<ActivitiesResponse | ErrorResponse>
) => {
  try {
    await ensureAuthenticated();
    const { start = 0, limit = 20 } = req.query;
    const client = getGarminClient();
    const activities = await client.getActivities(Number(start), Number(limit));
    res.json(activities as ActivitiesResponse);
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: error.message } as ErrorResponse);
  }
};

export const getActivityDetails = async (
  req: Request<GetActivityDetailsParams>,
  res: Response<ActivityDetails | ErrorResponse>
) => {
  try {
    await ensureAuthenticated();
    const { activityId } = req.params;
    const client = getGarminClient();
    const details = await client.getActivity({
      activityId: Number(activityId),
    });
    res.json(details as ActivityDetails);
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: error.message } as ErrorResponse);
  }
};
