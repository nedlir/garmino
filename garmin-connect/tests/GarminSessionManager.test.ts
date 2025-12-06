import { describe, it, expect, beforeEach, vi } from "vitest";
import { GarminSessionManager } from "../services/GarminSessionManager";
import { GarminConnect } from "@gooin/garmin-connect";

// Mock the GarminConnect module
vi.mock("@gooin/garmin-connect", () => {
  const MockGarminConnect = vi.fn(function(this: any) {
    this.login = vi.fn().mockResolvedValue(undefined);
    this.exportToken = vi.fn().mockReturnValue({
      oauth1: {
        oauth_token: "test_token",
        oauth_token_secret: "test_secret",
      },
      oauth2: {
        scope: "test_scope",
        jti: "test_jti",
        access_token: "test_access_token",
        token_type: "Bearer",
        refresh_token: "test_refresh_token",
        expires_in: 3600,
        refresh_token_expires_in: 7200,
        expires_at: Date.now() + 3600000,
        refresh_token_expires_at: Date.now() + 7200000,
        last_update_date: new Date().toISOString(),
        expires_date: new Date(Date.now() + 3600000).toISOString(),
      },
    });
    this.loadToken = vi.fn();
  });

  return {
    GarminConnect: MockGarminConnect,
  };
});

describe("GarminSessionManager", () => {
  let manager: GarminSessionManager;

  beforeEach(() => {
    manager = new GarminSessionManager();
    vi.clearAllMocks();
  });

  describe("createClient", () => {
    it("should create and store a new client for a user", async () => {
      const userId = "user-123";
      const credentials = { username: "test@example.com", password: "password123" };

      const client = await manager.createClient(userId, credentials);

      expect(client).toBeDefined();
      expect(GarminConnect).toHaveBeenCalledWith({
        username: credentials.username,
        password: credentials.password,
      });
      expect(client.login).toHaveBeenCalled();
      expect(manager.hasClient(userId)).toBe(true);
    });

    it("should store serialized session data after creating client", async () => {
      const userId = "user-456";
      const credentials = { username: "test2@example.com", password: "password456" };

      await manager.createClient(userId, credentials);

      const session = manager.getSerializedSession(userId);
      expect(session).toBeDefined();
      expect(session?.oauth1).toHaveProperty("oauth_token");
      expect(session?.oauth2).toHaveProperty("access_token");
    });
  });

  describe("getClient", () => {
    it("should return undefined for non-existent user", () => {
      const client = manager.getClient("non-existent-user");
      expect(client).toBeUndefined();
    });

    it("should return the client for an existing user", async () => {
      const userId = "user-789";
      const credentials = { username: "test3@example.com", password: "password789" };

      const createdClient = await manager.createClient(userId, credentials);
      const retrievedClient = manager.getClient(userId);

      expect(retrievedClient).toBe(createdClient);
    });
  });

  describe("removeClient", () => {
    it("should remove client and session data for a user", async () => {
      const userId = "user-remove";
      const credentials = { username: "remove@example.com", password: "password" };

      await manager.createClient(userId, credentials);
      expect(manager.hasClient(userId)).toBe(true);

      manager.removeClient(userId);

      expect(manager.hasClient(userId)).toBe(false);
      expect(manager.getClient(userId)).toBeUndefined();
      expect(manager.getSerializedSession(userId)).toBeUndefined();
    });
  });

  describe("restoreClient", () => {
    it("should restore a client from serialized session data", () => {
      const userId = "user-restore";
      const sessionData = {
        oauth1: {
          oauth_token: "restored_token",
          oauth_token_secret: "restored_secret",
        },
        oauth2: {
          scope: "restored_scope",
          jti: "restored_jti",
          access_token: "restored_access_token",
          token_type: "Bearer",
          refresh_token: "restored_refresh_token",
          expires_in: 3600,
          refresh_token_expires_in: 7200,
          expires_at: Date.now() + 3600000,
          refresh_token_expires_at: Date.now() + 7200000,
          last_update_date: new Date().toISOString(),
          expires_date: new Date(Date.now() + 3600000).toISOString(),
        },
      };

      const client = manager.restoreClient(userId, sessionData);

      expect(client).toBeDefined();
      expect(client.loadToken).toHaveBeenCalledWith(sessionData.oauth1, sessionData.oauth2);
      expect(manager.hasClient(userId)).toBe(true);
      expect(manager.getSerializedSession(userId)).toEqual(sessionData);
    });
  });

  describe("hasClient", () => {
    it("should return false for non-existent user", () => {
      expect(manager.hasClient("non-existent")).toBe(false);
    });

    it("should return true for existing user", async () => {
      const userId = "user-exists";
      const credentials = { username: "exists@example.com", password: "password" };

      await manager.createClient(userId, credentials);

      expect(manager.hasClient(userId)).toBe(true);
    });
  });

  describe("getActiveUserIds", () => {
    it("should return empty array when no clients exist", () => {
      expect(manager.getActiveUserIds()).toEqual([]);
    });

    it("should return all active user IDs", async () => {
      const user1 = "user-1";
      const user2 = "user-2";
      const user3 = "user-3";

      await manager.createClient(user1, { username: "user1@example.com", password: "pass1" });
      await manager.createClient(user2, { username: "user2@example.com", password: "pass2" });
      await manager.createClient(user3, { username: "user3@example.com", password: "pass3" });

      const activeIds = manager.getActiveUserIds();

      expect(activeIds).toHaveLength(3);
      expect(activeIds).toContain(user1);
      expect(activeIds).toContain(user2);
      expect(activeIds).toContain(user3);
    });
  });

  describe("getSerializedSession", () => {
    it("should return undefined for non-existent user", () => {
      expect(manager.getSerializedSession("non-existent")).toBeUndefined();
    });

    it("should return session data for existing user", async () => {
      const userId = "user-session";
      const credentials = { username: "session@example.com", password: "password" };

      await manager.createClient(userId, credentials);

      const session = manager.getSerializedSession(userId);

      expect(session).toBeDefined();
      expect(session?.oauth1.oauth_token).toBe("test_token");
      expect(session?.oauth2.access_token).toBe("test_access_token");
    });
  });
});
