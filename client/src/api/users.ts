import axios from 'axios';
import axiosInstance from '../config/axiosConfig';

export interface UserListItem {
  userId: string;
  email: string;
  username?: string;
}

export const getAllUsers = async (accessToken: string): Promise<UserListItem[]> => {
  try {
    const response = await axiosInstance.get<UserListItem[]>('/auth/users', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.message || 'Failed to fetch users');
    }
    throw new Error('Failed to fetch users');
  }
};
