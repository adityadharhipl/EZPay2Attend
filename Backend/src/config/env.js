require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_ACCESS_SECRET || 'secret', // Switched to access secret
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000'
};
