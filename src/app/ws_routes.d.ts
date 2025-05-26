import { Application } from 'express-ws';
import WebSocket from 'ws';
declare const wsInstance: Application & {
    ws: (path: string, handler: (ws: WebSocket) => void) => void;
};
export declare function setupWebSocketRoutes(app: Application): void;
export default wsInstance;
