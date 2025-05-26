import { Handler } from '@netlify/functions';
import express from 'express';
import expressWs from 'express-ws';
import bodyParser from 'body-parser';
import cors from 'cors';
import restRoutes from '../../dist/app/rest_routes';
import wsRoutes from '../../dist/app/ws_routes';

const app = express();
expressWs(app);

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(restRoutes);
app.use(wsRoutes);

// Create a serverless handler
const handler: Handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as { port: number };
      
      // Forward the request to the Express app
      const request = {
        method: event.httpMethod,
        path: event.path,
        headers: event.headers,
        body: event.body,
      };

      app(request, {
        statusCode: 200,
        headers: {},
        body: '',
        setHeader: (name: string, value: string) => {},
        end: (body: string) => {
          server.close();
          resolve({
            statusCode: 200,
            body,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        },
      });
    });
  });
};

export { handler }; 