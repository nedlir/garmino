interface GarminTokens {
  oauth1: string;
  oauth2: string;
}

interface GarminConnectionUpdate {
  garmin_oauth1_token?: string;
  garmin_oauth2_token?: string;
  last_sync_at?: Date;
  is_active?: boolean;
}

interface GarminConnectionCreate {
  user_id: string;
  garmin_oauth1_token?: string;
  garmin_oauth2_token?: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  isActive: boolean;
}

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

export async function storeGarminTokens(userId: string, tokens: GarminTokens): Promise<void> {
  const url = `${USER_SERVICE_URL}/users/${userId}/garmin-connection`;
  
  const body: GarminConnectionUpdate = {
    garmin_oauth1_token: tokens.oauth1,
    garmin_oauth2_token: tokens.oauth2,
    is_active: true,
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to store Garmin tokens: ${error}`);
  }
}


export async function getGarminTokens(userId: string): Promise<GarminTokens | null> {
  const url = `${USER_SERVICE_URL}/users/${userId}/garmin-connection`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Garmin tokens: ${error}`);
  }

  const data = await response.json();
  
  if (!data.garmin_oauth1_token || !data.garmin_oauth2_token) {
    return null;
  }

  return {
    oauth1: data.garmin_oauth1_token,
    oauth2: data.garmin_oauth2_token,
  };
}

export async function clearGarminTokens(userId: string): Promise<void> {
  const url = `${USER_SERVICE_URL}/users/${userId}/garmin-connection`;
  
  const body = {
    garmin_oauth1_token: null,
    garmin_oauth2_token: null,
    is_active: false,
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to clear Garmin tokens: ${error}`);
  }
}


export async function getGarminStatus(userId: string): Promise<ConnectionStatus> {
  const url = `${USER_SERVICE_URL}/users/${userId}/garmin-status`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Garmin status: ${error}`);
  }

  return await response.json();
}
