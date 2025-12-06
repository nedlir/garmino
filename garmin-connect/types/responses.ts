export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface ConnectResponse {
  success: boolean;
  message: string;
  connectedAt?: string;
}

export interface DisconnectResponse {
  success: boolean;
  message: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  isActive: boolean;
}

export interface UserProfile {
  profileId: number;
  displayName: string;
  fullName: string;
  userName: string;
  profileImageUrlLarge?: string;
  profileImageUrlMedium?: string;
  profileImageUrlSmall?: string;
  location?: string;
  emailAddress?: string;
  [key: string]: any; // Garmin API may return additional fields
}

export interface Activity {
  activityId: number;
  activityName: string;
  activityType: {
    typeId: number;
    typeKey: string;
    parentTypeId: number;
  };
  startTimeLocal: string;
  startTimeGMT: string;
  distance: number;
  duration: number;
  elapsedDuration: number;
  movingDuration: number;
  averageSpeed: number;
  maxSpeed: number;
  calories: number;
  averageHR?: number;
  maxHR?: number;
  steps?: number;
  [key: string]: any; // Garmin API may return additional fields
}

export interface ActivityDetails extends Activity {
  description?: string;
  locationName?: string;
  elevationGain?: number;
  elevationLoss?: number;
  minElevation?: number;
  maxElevation?: number;
  averageRunningCadenceInStepsPerMinute?: number;
  maxRunningCadenceInStepsPerMinute?: number;
  splits?: ActivitySplit[];
  [key: string]: any;
}

export interface ActivitySplit {
  distance: number;
  duration: number;
  averageSpeed: number;
  averageHR?: number;
  elevationGain?: number;
  elevationLoss?: number;
}

export interface ActivitySummary {
  activityId: number;
  activityName: string;
  activityType: string;
  startTimeLocal: string;
  distance: number;      // meters
  duration: number;      // seconds
  calories: number;
  averageHR?: number;
}

export interface ActivitiesResponse {
  activities: ActivitySummary[];
  total: number;
  start: number;
  limit: number;
}
