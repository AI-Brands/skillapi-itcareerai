import { Handler, HandlerContext, HandlerResponse } from '@netlify/functions';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// Import routes after they are built
const restRoutes = require('../../dist/app/rest_routes').default;

const app = express();

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

// Create a serverless handler
const handler: Handler = async (event, context: HandlerContext): Promise<HandlerResponse> => {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as { port: number };
      
      // Create a mock request object that matches Express's Request interface
      const mockRequest = {
        method: event.httpMethod,
        url: event.path,
        headers: event.headers,
        body: event.body,
        // Add required Express Request methods
        get: (header: string) => event.headers[header.toLowerCase()],
        header: (header: string) => event.headers[header.toLowerCase()],
        accepts: () => true,
        acceptsCharsets: () => true,
        acceptsEncodings: () => true,
        acceptsLanguages: () => true,
        param: () => '',
        is: () => false,
        protocol: 'https',
        secure: true,
        ip: '',
        ips: [],
        subdomains: [],
        path: event.path,
        hostname: '',
        host: '',
        fresh: false,
        stale: true,
        xhr: false,
        cookies: {},
        signedCookies: {},
        secret: undefined,
        query: {},
        route: {},
        originalUrl: event.path,
        baseUrl: '',
        params: {},
        app: app,
        res: {} as Response,
        next: () => {},
      } as unknown as Request;

      const mockResponse = {
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
      } as unknown as Response;

      app(mockRequest, mockResponse);
    });
  });
};

export { handler }; 