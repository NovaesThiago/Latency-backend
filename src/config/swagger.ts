import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Latency API',
      version: '1.0.0',
      description: 'API REST do jogo Latency (TCG tático por turnos, tema ciberguerra)',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, '../routes/*.{ts,js}').split(path.sep).join('/')],
});
