// This code was assisted by ChatGPT, OpenAI.

const swaggerJSDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SpongeChat API",
            version: "1.0.0",
            description: "SpongeChat API provides authentication, chatbot interaction, and admin tools " +
                "for managing users, roles, and API usage. It supports JWT-based access with cookie " +
                "authentication and tracks per-user API call stats."
        },
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token"
                }
            }
        },
        security: [{ cookieAuth: [] }]
    },
    apis: ["./classes/swagger_ui/swaggerDocs.js"]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
