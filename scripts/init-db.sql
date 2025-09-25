-- Initialize database for Memlernado development
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create a test user for development (optional)
-- This will be created by your application's registration flow
