import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'User profile and Garmin connection management service',
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            username: {
              type: 'string',
              nullable: true,
              description: 'Username',
            },
            first_name: {
              type: 'string',
              nullable: true,
              description: 'First name',
            },
            last_name: {
              type: 'string',
              nullable: true,
              description: 'Last name',
            },
            avatar_url: {
              type: 'string',
              nullable: true,
              description: 'Avatar URL',
            },
            bio: {
              type: 'string',
              nullable: true,
              description: 'User bio',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        GarminStatus: {
          type: 'object',
          properties: {
            isConnected: {
              type: 'boolean',
              description: 'Whether Garmin is connected',
            },
            connectedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Connection timestamp',
            },
            lastSyncAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last sync timestamp',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether connection is active',
            },
          },
        },
      },
      securitySchemes: {
        UserIdHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-User-Id',
          description: 'User ID extracted from JWT by API Gateway',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
