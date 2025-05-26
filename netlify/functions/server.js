"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
// Import routes after they are built
const restRoutes = require('../../dist/app/rest_routes').default;
const app = (0, express_1.default)();
// Enable CORS for all routes
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
    credentials: true
}));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use(restRoutes);
// Create a serverless handler
const handler = async (event, context) => {
    return new Promise((resolve, reject) => {
        const server = app.listen(0, () => {
            const { port } = server.address();
            // Create a mock request object that matches Express's Request interface
            const mockRequest = {
                method: event.httpMethod,
                url: event.path,
                headers: event.headers,
                body: event.body,
                // Add required Express Request methods
                get: (header) => event.headers[header.toLowerCase()],
                header: (header) => event.headers[header.toLowerCase()],
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
                res: {},
                next: () => { },
            };
            const mockResponse = {
                statusCode: 200,
                headers: {},
                body: '',
                setHeader: (name, value) => { },
                end: (body) => {
                    server.close();
                    resolve({
                        statusCode: 200,
                        body,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                },
            };
            app(mockRequest, mockResponse);
        });
    });
};
exports.handler = handler;
//# sourceMappingURL=server.js.map