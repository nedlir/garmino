export interface LoginRequest {
  username: string;
  password: string;
}

export interface ConnectRequest {
  username: string;
  password: string;
}

export interface GetActivitiesQuery {
  start?: number;
  limit?: number;
}

export interface ActivityListParams {
  start?: number;
  limit?: number;
}

export interface GetActivityDetailsParams {
  activityId: string;
}
