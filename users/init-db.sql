CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- Garmin connections table
CREATE TABLE garmin_connections (
  user_id UUID PRIMARY KEY,
  garmin_oauth1_token TEXT,
  garmin_oauth2_token TEXT,
  connected_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Automatically update updated_at for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatically update updated_at for garmin_connections
CREATE TRIGGER update_garmin_connections_updated_at
  BEFORE UPDATE ON garmin_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
