-- Initialize the database
-- This file is executed when the PostgreSQL container starts for the first time

-- Create additional extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The database and user are already created via environment variables
-- This file can be used for additional initialization if needed

SELECT 'Database initialized successfully' as message;
