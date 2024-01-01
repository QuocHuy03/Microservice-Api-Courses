import swaggerJSDoc from "swagger-jsdoc";
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Courses",
      version: "1.0.0",
      description: "API documentation for your Express application",
      author: {
        name: "Lê Quốc Huy",
        email: "qhuy.dev@example.com",
      },
    },
    servers: [
      {
        url: "https://api.linhkienmaytinh.onlick",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./dist/routes/user.routes.js"],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
