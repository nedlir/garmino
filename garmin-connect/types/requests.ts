// User-related request types
export interface LoginRequest {
  username: string;
  password: string;
}

// Metrics-related request types
export interface GetActivitiesQuery {
  start?: number;
  limit?: number;
}

export interface GetActivityDetailsParams {
  activityId: string;
}
