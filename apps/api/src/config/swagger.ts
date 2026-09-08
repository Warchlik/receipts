import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Receipts API",
      version: "1.0.0",
      description:
        "API for splitting receipts across guest and authenticated members, invites, and expense splitting.",
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
        name: "Receipts",
        description: "Receipt splitting endpoints",
      },
      {
        name: "Expenses",
        description:
          "Expense line items attached to a receipt",
      },
      {
        name: "Invites",
        description:
          "Invite tokens to join or claim a receipt member",
      },
      {
        name: "Profiles",
        description: "Current user's profile endpoints",
      },
    ],
    components: {
      schemas: {
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
