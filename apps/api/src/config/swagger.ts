import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express TypeScript API",
      version: "1.0.0",
      description:
        "API documentation for Express.js TypeScript template",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Examples",
        description: "Example CRUD endpoints",
      },
    ],
    components: {
      schemas: {
        Example: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example:
                "550e8400-e29b-41d4-a716-446655440000",
            },
            name: {
              type: "string",
              example: "Example name",
            },
            description: {
              type: "string",
              nullable: true,
              example: "Example description",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CreateExampleInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              example: "Example name",
            },
            description: {
              type: "string",
              example: "Example description",
            },
          },
        },
        UpdateExampleInput: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "Updated example name",
            },
            description: {
              type: "string",
              example: "Updated description",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Something went wrong",
            },
          },
        },
      },
    },
  },
  apis: ["./src/**/*.routes.ts"],
});
