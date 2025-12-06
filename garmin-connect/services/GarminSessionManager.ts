import { GarminConnect } from "@gooin/garmin-connect";
import { IGarminTokens, IOauth1Token, IOauth2Token } from "@gooin/garmin-connect/dist/garmin/types";

interface GarminCredentials {
  username: string;
  password: string;
}

interface SerializedSession {
  oauth1: IOauth1Token;
  oauth2: IOauth2Token;
}

/**
 * Manages per-user Garmin Connect client instances with session persistence
 */
export class GarminSessionManager {
  private clients: Map<string, GarminConnect> = new Map();
  private sessions: Map<string, SerializedSession> = new Map();

  /**
   * Get an existing Garmin client for a user
   * @param userId - The user ID
   * @returns The GarminConnect client instance or undefined if not found
   */
  getClient(userId: string): GarminConnect | undefined {
    return this.clients.get(userId);
  }

  /**
   * Create a new Garmin client for a user with credentials
   * Authenticates with Garmin and stores the session
   * @param userId - The user ID
   * @param credentials - Garmin username and password
   * @returns The authenticated GarminConnect client instance
   * @throws Error if authentication fails
   */
  async createClient(userId: string, credentials: GarminCredentials): Promise<GarminConnect> {
    // Create new client with credentials
    const client = new GarminConnect({
      username: credentials.username,
      password: credentials.password,
    });

    // Authenticate with Garmin
    await client.login();

    // Export and store the session tokens
    const tokens = client.exportToken();
    this.sessions.set(userId, {
      oauth1: tokens.oauth1,
      oauth2: tokens.oauth2,
    });

    // Store the client instance
    this.clients.set(userId, client);

    return client;
  }

  /**
   * Remove a user's Garmin client and session data
   * @param userId - The user ID
   */
  removeClient(userId: string): void {
    this.clients.delete(userId);
    this.sessions.delete(userId);
  }

  /**
   * Get serialized session data for a user
   * @param userId - The user ID
   * @returns Serialized session tokens or undefined if not found
   */
  getSerializedSession(userId: string): SerializedSession | undefined {
    return this.sessions.get(userId);
  }

  /**
   * Restore a client from serialized session data
   * @param userId - The user ID
   * @param sessionData - Serialized session tokens
   * @returns The restored GarminConnect client instance
   */
  restoreClient(userId: string, sessionData: SerializedSession): GarminConnect {
    // Create a client with dummy credentials (not used when loading tokens)
    const client = new GarminConnect({
      username: "",
      password: "",
    });

    // Load the stored tokens
    client.loadToken(sessionData.oauth1, sessionData.oauth2);

    // Store the client and session
    this.clients.set(userId, client);
    this.sessions.set(userId, sessionData);

    return client;
  }

  /**
   * Check if a user has an active client
   * @param userId - The user ID
   * @returns True if the user has an active client
   */
  hasClient(userId: string): boolean {
    return this.clients.has(userId);
  }

  /**
   * Get all active user IDs
   * @returns Array of user IDs with active clients
   */
  getActiveUserIds(): string[] {
    return Array.from(this.clients.keys());
  }
}
