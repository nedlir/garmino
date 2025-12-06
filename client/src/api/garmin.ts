import axios from 'axios';
import axiosInstance from '../config/axiosConfig';

export interface GarminCredentials {
  username: string;
  password: string;
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

export interface ActivityListParams {
  start?: number;
  limit?: number;
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

export const connectGarmin = async (credentials: GarminCredentials): Promise<ConnectResponse> => {
  try {
    const response = await axiosInstance.post<ConnectResponse>('/garmin/connect', credentials);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.message || 'Failed to connect Garmin account');
    }
    throw new Error('Failed to connect Garmin account');
  }
};

export const disconnectGarmin = async (): Promise<DisconnectResponse> => {
  try {
    const response = await axiosInstance.post<DisconnectResponse>('/garmin/disconnect');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.message || 'Failed to disconnect Garmin account');
    }
    throw new Error('Failed to disconnect Garmin account');
  }
};

export const getGarminStatus = async (): Promise<ConnectionStatus> => {
  try {
    const response = await axiosInstance.get<ConnectionStatus>('/garmin/status');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.message || 'Failed to fetch Garmin status');
    }
    throw new Error('Failed to fetch Garmin status');
  }
};

export const getGarminActivities = async (params?: ActivityListParams): Promise<ActivitiesResponse> => {
  try {
    const response = await axiosInstance.get<ActivitiesResponse>('/garmin/activities', {
      params,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.message || 'Failed to fetch Garmin activities');
    }
    throw new Error('Failed to fetch Garmin activities');
  }
};
